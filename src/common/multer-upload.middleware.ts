import multer, { Options, StorageEngine, FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { FILE_CONFIG } from '../constants/file-config';
import { config } from '../config/environment';
import { logError, logInfo } from '../utils/logger';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Multer configuration interface
export interface MulterUploadConfig {
  storage?: StorageEngine;
  fileFilter?: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
  limits?: {
    fileSize?: number;
    files?: number;
    fields?: number;
    parts?: number;
  };
  preservePath?: boolean;
  fieldName?: string;
  maxCount?: number;
  allowedMimeTypes?: string[];
  destinationPath?: string;
}

// Upload strategies enum
export enum UploadStrategy {
  MEMORY = 'memory',
  DISK = 'disk',
  CLOUDINARY = 'cloudinary' // For future use with cloudinary multer
}

// Multer error handling
export class MulterUploadError extends Error {
  public code: string;
  public field?: string;
  public statusCode: number;

  constructor(message: string, code: string, field?: string, statusCode: number = 400) {
    super(message);
    this.name = 'MulterUploadError';
    this.code = code;
    this.field = field;
    this.statusCode = statusCode;
  }
}

// Memory storage configuration (recommended for Cloudinary uploads)
const createMemoryStorage = (): StorageEngine => {
  return multer.memoryStorage();
};

// Disk storage configuration (for local file storage)
const createDiskStorage = (destinationPath: string = config.UPLOAD_DIR): StorageEngine => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Create directory if it doesn't exist
      const uploadPath = path.join(process.cwd(), destinationPath);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filter function factory
const createFileFilter = (allowedMimeTypes?: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    logInfo('File filter validation', {
      filename: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // If no specific mime types are provided, use general validation
    if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
      // Check against all allowed mime types from config
      const allAllowedTypes = [
        ...getAllowedMimeTypes(FILE_CONFIG.ALLOWED_TYPES.IMAGES),
        ...getAllowedMimeTypes(FILE_CONFIG.ALLOWED_TYPES.AUDIO),
        ...getAllowedMimeTypes(FILE_CONFIG.ALLOWED_TYPES.VIDEO),
        ...getAllowedMimeTypes(FILE_CONFIG.ALLOWED_TYPES.DOCUMENTS)
      ];

      if (!allAllowedTypes.includes(file.mimetype)) {
        return cb(new MulterUploadError(
          `File type ${file.mimetype} is not allowed`,
          'INVALID_FILE_TYPE',
          file.fieldname
        ));
      }
    } else {
      // Check against specific allowed mime types
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new MulterUploadError(
          `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
          'INVALID_FILE_TYPE',
          file.fieldname
        ));
      }
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    const allAllowedExtensions: string[] = Object.values(FILE_CONFIG.ALLOWED_TYPES).flat();
    
    if (!allAllowedExtensions.includes(fileExtension)) {
      return cb(new MulterUploadError(
        `File extension .${fileExtension} is not allowed`,
        'INVALID_FILE_EXTENSION',
        file.fieldname
      ));
    }

    cb(null, true);
  };
};

// Helper function to get mime types for file extensions
const getAllowedMimeTypes = (extensions: readonly string[]): string[] => {
  const mimeTypeMap: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/m4a',
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  };

  return extensions.map(ext => mimeTypeMap[ext]).filter(Boolean);
};

// Create multer instance with configuration
export const createMulterUpload = (
  strategy: UploadStrategy = UploadStrategy.MEMORY,
  uploadConfig: MulterUploadConfig = {}
): multer.Multer => {
  const {
    limits = {
      fileSize: FILE_CONFIG.MAX_SIZE,
      files: 5,
      fields: 10,
      parts: 15
    },
    allowedMimeTypes,
    destinationPath = config.UPLOAD_DIR
  } = uploadConfig;

  // Choose storage strategy
  let storage: StorageEngine;
  switch (strategy) {
    case UploadStrategy.MEMORY:
      storage = createMemoryStorage();
      break;
    case UploadStrategy.DISK:
      storage = createDiskStorage(destinationPath);
      break;
    default:
      storage = createMemoryStorage();
  }

  const multerConfig: Options = {
    storage,
    fileFilter: uploadConfig.fileFilter || createFileFilter(allowedMimeTypes),
    limits,
    preservePath: uploadConfig.preservePath || false,
    ...uploadConfig
  };

  return multer(multerConfig);
};

// Error handling middleware for multer
export const handleMulterError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    logError('Multer error occurred', {
      code: error.code,
      message: error.message,
      field: error.field
    });

    let statusCode = 400;
    let errorMessage = error.message;
    let errorCode = error.code;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = `File size exceeds maximum limit of ${FILE_CONFIG.MAX_SIZE / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded';
        break;
      case 'LIMIT_FIELD_COUNT':
        errorMessage = 'Too many fields in form';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        errorMessage = 'Too many parts in multipart form';
        break;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        field: error.field
      }
    });
    return;
  }

  if (error instanceof MulterUploadError) {
    logError('Custom multer error occurred', {
      code: error.code,
      message: error.message,
      field: error.field
    });

    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        field: error.field
      }
    });
    return;
  }

  // Unknown error
  logError('Unknown error in multer middleware', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'UNKNOWN_UPLOAD_ERROR',
      message: 'An unknown error occurred during file upload'
    }
  });
};

// Predefined multer middleware instances
export const memoryUpload = createMulterUpload(UploadStrategy.MEMORY);
export const diskUpload = createMulterUpload(UploadStrategy.DISK);

// Specific upload middlewares for different file types
export const uploadSingleImage = memoryUpload.single('image');
export const uploadMultipleImages = memoryUpload.array('images', 5);
export const uploadSingleAudio = memoryUpload.single('audio');
export const uploadSingleVideo = memoryUpload.single('video');
export const uploadSingleDocument = memoryUpload.single('document');

// Middleware factory for custom field names
export const createSingleFileUpload = (fieldName: string, strategy: UploadStrategy = UploadStrategy.MEMORY) => {
  const upload = createMulterUpload(strategy);
  return upload.single(fieldName);
};

export const createMultipleFileUpload = (
  fieldName: string,
  maxCount: number = 5,
  strategy: UploadStrategy = UploadStrategy.MEMORY
) => {
  const upload = createMulterUpload(strategy);
  return upload.array(fieldName, maxCount);
};

// Advanced upload middleware with validation
export const createAdvancedUpload = (
  fieldName: string,
  config: MulterUploadConfig & {
    strategy?: UploadStrategy;
    multiple?: boolean;
    maxCount?: number;
  } = {}
) => {
  const {
    strategy = UploadStrategy.MEMORY,
    multiple = false,
    maxCount = 1,
    ...multerConfig
  } = config;

  const upload = createMulterUpload(strategy, multerConfig);

  return (req: Request, res: Response, next: NextFunction) => {
    const middleware = multiple
      ? upload.array(fieldName, maxCount)
      : upload.single(fieldName);

    middleware(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }

      logInfo('File upload middleware completed', {
        fieldName,
        hasFile: !!req.file,
        hasFiles: !!(req.files && Array.isArray(req.files) && req.files.length > 0),
        fileCount: req.files && Array.isArray(req.files) ? req.files.length : (req.file ? 1 : 0)
      });

      next();
    });
  };
};

// Wrapper to combine multer and error handling
export const createUploadMiddleware = (
  fieldName: string,
  config: MulterUploadConfig & {
    strategy?: UploadStrategy;
    multiple?: boolean;
    maxCount?: number;
  } = {}
) => {
  return [
    createAdvancedUpload(fieldName, config),
    // Error handling is already built into createAdvancedUpload
  ];
}; 
import { Request, Response, NextFunction } from 'express';
import { FILE_CONFIG } from '../constants/file-config';
import { CloudinaryUploader } from '../services/common/cloudinary-uploader.service';
import { logError, logInfo } from '../utils/logger';

// File validation configuration interface
export interface FileValidationConfig {
  maxFileSize?: number;
  allowedTypes?: string[];
  required?: boolean;
  fieldName?: string;
  maxFiles?: number;
  customValidation?: (file: Express.Multer.File) => { isValid: boolean; error?: string };
}

// File validation error interface
export interface FileValidationError {
  field: string;
  message: string;
  code: string;
}

// Custom error class for file validation
export class FileValidationException extends Error {
  public statusCode: number;
  public code: string;
  public errors: FileValidationError[];

  constructor(errors: FileValidationError[], statusCode: number = 400, code: string = 'FILE_VALIDATION_ERROR') {
    super('File validation failed');
    this.name = 'FileValidationException';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

// File validation middleware factory
export const createFileValidationMiddleware = (
  config: FileValidationConfig = {}
) => {
  const {
    maxFileSize = FILE_CONFIG.MAX_SIZE,
    allowedTypes = Object.values(FILE_CONFIG.ALLOWED_TYPES).flat(),
    required = false,
    fieldName = 'file',
    maxFiles = 1,
    customValidation
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logInfo('File validation middleware started', {
        fieldName,
        hasFiles: !!(req.files || req.file),
        contentType: req.get('content-type')
      });

      const errors: FileValidationError[] = [];
      const cloudinaryUploader = CloudinaryUploader.getInstance();

      // Check if files are present when required
      if (required && !req.file && !req.files) {
        errors.push({
          field: fieldName,
          message: `${fieldName} is required`,
          code: 'REQUIRED_FILE_MISSING'
        });
      }

      // Validate single file
      if (req.file) {
        const fileErrors = validateSingleFile(req.file, cloudinaryUploader, {
          maxFileSize,
          allowedTypes,
          fieldName,
          customValidation
        });
        errors.push(...fileErrors);
      }

      // Validate multiple files
      if (req.files) {
        if (Array.isArray(req.files)) {
          // Handle array of files
          if (req.files.length > maxFiles) {
            errors.push({
              field: fieldName,
              message: `Maximum ${maxFiles} files allowed`,
              code: 'TOO_MANY_FILES'
            });
          }

          for (const file of req.files) {
            const fileErrors = validateSingleFile(file, cloudinaryUploader, {
              maxFileSize,
              allowedTypes,
              fieldName,
              customValidation
            });
            errors.push(...fileErrors);
          }
        } else {
          // Handle files object with field names
          for (const [field, filesArray] of Object.entries(req.files)) {
            if (Array.isArray(filesArray)) {
              for (const file of filesArray) {
                const fileErrors = validateSingleFile(file, cloudinaryUploader, {
                  maxFileSize,
                  allowedTypes,
                  fieldName: field,
                  customValidation
                });
                errors.push(...fileErrors);
              }
            }
          }
        }
      }

      // If there are validation errors, throw exception
      if (errors.length > 0) {
        logError('File validation failed', { errors });
        throw new FileValidationException(errors);
      }

      logInfo('File validation completed successfully', {
        fieldName,
        fileCount: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : (req.file ? 1 : 0)
      });

      next();
    } catch (error) {
      if (error instanceof FileValidationException) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.errors
          }
        });
        return;
      }

      logError('Unexpected error in file validation middleware', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during file validation'
        }
      });
    }
  };
};

// Helper function to validate a single file
const validateSingleFile = (
  file: Express.Multer.File,
  cloudinaryUploader: CloudinaryUploader,
  config: {
    maxFileSize: number;
    allowedTypes: string[];
    fieldName: string;
    customValidation?: (file: Express.Multer.File) => { isValid: boolean; error?: string };
  }
): FileValidationError[] => {
  const errors: FileValidationError[] = [];
  const { maxFileSize, allowedTypes, fieldName, customValidation } = config;

  // Basic file validation using CloudinaryUploader
  const validationResult = cloudinaryUploader.validateFile(file);
  
  if (!validationResult.isValid) {
    errors.push({
      field: fieldName,
      message: validationResult.errors.join(', '),
      code: 'FILE_VALIDATION_FAILED'
    });
  }

  // Additional size validation (double check)
  if (file.size > maxFileSize) {
    errors.push({
      field: fieldName,
      message: `File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB`,
      code: 'FILE_SIZE_EXCEEDED'
    });
  }

  // Check file extension against allowed types
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  if (fileExtension && !allowedTypes.includes(fileExtension)) {
    errors.push({
      field: fieldName,
      message: `File extension .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      code: 'FILE_TYPE_NOT_ALLOWED'
    });
  }

  // Custom validation if provided
  if (customValidation) {
    const customResult = customValidation(file);
    if (!customResult.isValid) {
      errors.push({
        field: fieldName,
        message: customResult.error || 'Custom validation failed',
        code: 'CUSTOM_VALIDATION_FAILED'
      });
    }
  }

  return errors;
};

// Predefined validation middlewares for common use cases
export const validateImageUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.IMAGES],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: true,
  fieldName: 'image'
});

export const validateAudioUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.AUDIO],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: true,
  fieldName: 'audio'
});

export const validateVideoUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.VIDEO],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: true,
  fieldName: 'video'
});

export const validateDocumentUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.DOCUMENTS],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: true,
  fieldName: 'document'
});

export const validateOptionalImageUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.IMAGES],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: false,
  fieldName: 'image'
});

export const validateMultipleImageUpload = createFileValidationMiddleware({
  allowedTypes: [...FILE_CONFIG.ALLOWED_TYPES.IMAGES],
  maxFileSize: FILE_CONFIG.MAX_SIZE,
  required: true,
  fieldName: 'images',
  maxFiles: 5
});

// Security validation middleware
export const validateFileSecurityMiddleware = createFileValidationMiddleware({
  customValidation: (file: Express.Multer.File) => {
    // Check for malicious file names
    const maliciousPatterns = [
      /\.\./,                    // Directory traversal
      /[<>:"|?*]/,              // Invalid characters
      /\.(exe|bat|cmd|com|scr|vbs|js|jar|php|asp|aspx|jsp)$/i  // Executable files
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(file.originalname)) {
        return {
          isValid: false,
          error: 'File name contains potentially dangerous characters or extensions'
        };
      }
    }

    // Check for executable file signatures (magic bytes)
    const dangerousSignatures = [
      'MZ',     // Windows executable
      'PK',     // ZIP archive (could contain executables)
      '\x7fELF' // Linux executable
    ];

    const fileHeader = file.buffer ? file.buffer.toString('ascii', 0, 4) : '';
    for (const signature of dangerousSignatures) {
      if (fileHeader.startsWith(signature)) {
        return {
          isValid: false,
          error: 'File appears to be an executable or archive file'
        };
      }
    }

    return { isValid: true };
  }
});

// Comprehensive validation middleware that includes security checks
export const validateFileUploadWithSecurity = (config: FileValidationConfig = {}) => {
  return [
    validateFileSecurityMiddleware,
    createFileValidationMiddleware(config)
  ];
}; 
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary';
import { FILE_CONFIG } from '../../constants/file-config';
import { logError, logInfo } from '../../utils/logger';
import { ServiceResponse } from '../../interface/base.interface';

// Upload options interface
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any;
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
  eager?: any[];
  eager_async?: boolean;
  overwrite?: boolean;
  unique_filename?: boolean;
  use_filename?: boolean;
  tags?: string[];
}

// Upload result interface
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  duration?: number; // For video/audio files
}

// File validation interface
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileType?: 'image' | 'audio' | 'video' | 'document';
}

// Upload service interface (following Interface Segregation Principle)
export interface ICloudinaryUploader {
  uploadFile(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<CloudinaryUploadResult>>;
  uploadBuffer(buffer: Buffer, options?: CloudinaryUploadOptions): Promise<ServiceResponse<CloudinaryUploadResult>>;
  deleteFile(publicId: string): Promise<ServiceResponse<boolean>>;
  generateUrl(publicId: string, transformation?: any): string;
  validateFile(file: Express.Multer.File): FileValidationResult;
}

// Custom error classes
export class CloudinaryError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string = 'CLOUDINARY_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'CloudinaryError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class FileValidationError extends CloudinaryError {
  constructor(message: string) {
    super(message, 'FILE_VALIDATION_ERROR', 400);
    this.name = 'FileValidationError';
  }
}

// Main CloudinaryUploader service (following Single Responsibility Principle)
export class CloudinaryUploader implements ICloudinaryUploader {
  private static instance: CloudinaryUploader;
  private readonly allowedMimeTypes: Map<string, string[]> = new Map([
    ['image', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']],
    ['audio', ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp3']],
    ['video', ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime']],
    ['document', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']],
  ]);

  private constructor() {
    if (!isCloudinaryConfigured()) {
      throw new CloudinaryError('Cloudinary is not properly configured', 'CLOUDINARY_CONFIG_ERROR', 500);
    }
  }

  // Singleton pattern implementation (following Dependency Inversion Principle)
  public static getInstance(): CloudinaryUploader {
    if (!CloudinaryUploader.instance) {
      CloudinaryUploader.instance = new CloudinaryUploader();
    }
    return CloudinaryUploader.instance;
  }

  /**
   * Upload a file to Cloudinary
   * @param file - Express.Multer.File object
   * @param options - Upload options
   * @returns Promise<ServiceResponse<CloudinaryUploadResult>>
   */
  public async uploadFile(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions = {}
  ): Promise<ServiceResponse<CloudinaryUploadResult>> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          code: 'FILE_VALIDATION_ERROR'
        };
      }

      // Set default options based on file type
      const uploadOptions = this.prepareUploadOptions(file, options, validation.fileType!);

      logInfo('Uploading file to Cloudinary', {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        folder: uploadOptions.folder
      });

      // Upload to Cloudinary
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Unknown upload error'));
            }
          }
        ).end(file.buffer);
      });

      const uploadResult = this.formatUploadResult(result);

      logInfo('File uploaded successfully to Cloudinary', {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        bytes: uploadResult.bytes
      });

      return {
        success: true,
        data: uploadResult
      };

    } catch (error) {
      logError('Failed to upload file to Cloudinary', error);
      
      if (error instanceof CloudinaryError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      return {
        success: false,
        error: 'Failed to upload file',
        code: 'UPLOAD_ERROR'
      };
    }
  }

  /**
   * Upload a buffer to Cloudinary
   * @param buffer - Buffer data
   * @param options - Upload options
   * @returns Promise<ServiceResponse<CloudinaryUploadResult>>
   */
  public async uploadBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<ServiceResponse<CloudinaryUploadResult>> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          options,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Unknown upload error'));
            }
          }
        ).end(buffer);
      });

      const uploadResult = this.formatUploadResult(result);

      logInfo('Buffer uploaded successfully to Cloudinary', {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        bytes: uploadResult.bytes
      });

      return {
        success: true,
        data: uploadResult
      };

    } catch (error) {
      logError('Failed to upload buffer to Cloudinary', error);
      
      return {
        success: false,
        error: 'Failed to upload buffer',
        code: 'UPLOAD_ERROR'
      };
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @returns Promise<ServiceResponse<boolean>>
   */
  public async deleteFile(publicId: string): Promise<ServiceResponse<boolean>> {
    try {
      await cloudinary.uploader.destroy(publicId);
      
      logInfo('File deleted successfully from Cloudinary', { public_id: publicId });
      
      return {
        success: true,
        data: true
      };

    } catch (error) {
      logError('Failed to delete file from Cloudinary', error);
      
      return {
        success: false,
        error: 'Failed to delete file',
        code: 'DELETE_ERROR'
      };
    }
  }

  /**
   * Generate a Cloudinary URL with transformations
   * @param publicId - Public ID of the file
   * @param transformation - Transformation options
   * @returns Cloudinary URL
   */
  public generateUrl(publicId: string, transformation: any = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformation
    });
  }

  /**
   * Validate file before upload
   * @param file - Express.Multer.File object
   * @returns FileValidationResult
   */
  public validateFile(file: Express.Multer.File): FileValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      errors.push(`File size exceeds maximum limit of ${FILE_CONFIG.MAX_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    let fileType: 'image' | 'audio' | 'video' | 'document' | undefined;
    
    for (const [type, mimeTypes] of this.allowedMimeTypes) {
      if (mimeTypes.includes(file.mimetype)) {
        fileType = type as 'image' | 'audio' | 'video' | 'document';
        break;
      }
    }

    if (!fileType) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      errors.push('File must have a valid extension');
    } else {
      const allowedExtensions: string[] = Object.values(FILE_CONFIG.ALLOWED_TYPES).flat();
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`File extension .${fileExtension} is not allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fileType
    };
  }

  /**
   * Prepare upload options based on file type
   * @private
   */
  private prepareUploadOptions(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions,
    fileType: string
  ): CloudinaryUploadOptions {
    const defaultOptions: CloudinaryUploadOptions = {
      resource_type: 'auto',
      unique_filename: true,
      use_filename: true,
      overwrite: false,
      folder: this.getFolderByType(fileType),
      tags: [fileType, 'edtech-platform'],
      ...options
    };

    // Set specific options for different file types
    switch (fileType) {
      case 'image':
        defaultOptions.resource_type = 'image';
        defaultOptions.quality = 'auto';
        defaultOptions.format = 'auto';
        break;
      case 'audio':
        defaultOptions.resource_type = 'video'; // Cloudinary treats audio as video
        break;
      case 'video':
        defaultOptions.resource_type = 'video';
        break;
      case 'document':
        defaultOptions.resource_type = 'raw';
        break;
    }

    return defaultOptions;
  }

  /**
   * Get folder name based on file type
   * @private
   */
  private getFolderByType(fileType: string): string {
    const folderMap: Record<string, string> = {
      image: 'images',
      audio: 'audio',
      video: 'videos',
      document: 'documents'
    };

    return folderMap[fileType] || 'misc';
  }

  /**
   * Format upload result
   * @private
   */
  private formatUploadResult(result: UploadApiResponse): CloudinaryUploadResult {
    return {
      public_id: result.public_id,
      version: result.version,
      signature: result.signature,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
      tags: result.tags || [],
      bytes: result.bytes,
      type: result.type,
      etag: result.etag,
      placeholder: result.placeholder,
      url: result.url,
      secure_url: result.secure_url,
      folder: result.folder,
      original_filename: result.original_filename,
      duration: result.duration
    };
  }
} 
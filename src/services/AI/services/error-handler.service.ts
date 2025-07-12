import { Response } from 'express';
import { CloudinaryError, FileValidationError } from '../../../services/common/cloudinary-uploader.service';
import { logError, logInfo } from '../../../utils/logger';
import { MulterUploadError } from '../../../common/multer-upload.middleware';
import { FileValidationException } from '../../../common/file-validation.middleware';

/**
 * Centralized error handling service for file uploads and Cloudinary operations
 */
export class UploadErrorHandler {
  /**
   * Handle upload-related errors and send appropriate response
   * 
   * @param error The error to handle
   * @param res Express Response object
   * @param context Additional context for logging
   */
  public static handleUploadError(error: any, res: Response, context: any = {}): void {
    logError('Upload error occurred', error, context);

    // Handle Cloudinary errors
    if (error instanceof CloudinaryError) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'CLOUDINARY_ERROR',
          message: error.message || 'Error occurred during cloud storage operation',
          details: context
        }
      });
      return;
    }

    // Handle file validation errors
    if (error instanceof FileValidationError || error instanceof FileValidationException) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || 'FILE_VALIDATION_ERROR',
          message: error.message || 'File validation failed',
          details: error instanceof FileValidationException ? error.errors : context
        }
      });
      return;
    }

    // Handle Multer upload errors
    if (error instanceof MulterUploadError) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: {
          code: error.code || 'UPLOAD_ERROR',
          message: error.message || 'File upload failed',
          field: error.field,
          details: context
        }
      });
      return;
    }

    // Handle Multer errors
    if (error && error.name === 'MulterError') {
      let message = 'File upload error';
      
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File size exceeds the allowed limit';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field in upload';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files uploaded';
          break;
        default:
          message = `File upload error: ${error.message}`;
      }

      res.status(400).json({
        success: false,
        error: {
          code: error.code || 'MULTER_ERROR',
          message,
          field: error.field,
          details: context
        }
      });
      return;
    }

    // Handle missing files
    if (error && error.message && error.message.includes('File is required')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: error.message,
          details: context
        }
      });
      return;
    }

    // Generic error handling
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during file processing',
        details: {
          ...context,
          errorMessage: error?.message || 'Unknown error'
        }
      }
    });
  }

  /**
   * Log successful upload for monitoring
   * 
   * @param fileInfo Information about the uploaded file
   * @param context Additional context for logging
   */
  public static logSuccessfulUpload(fileInfo: any, context: any = {}): void {
    logInfo('File upload successful', {
      ...fileInfo,
      ...context
    });
  }

  /**
   * Create an appropriate error response object
   * 
   * @param code Error code
   * @param message Error message
   * @param details Additional error details
   */
  public static createErrorResponse(code: string, message: string, details?: any): any {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    };
  }
} 
/**
 * Upload domain interfaces for file handling and Cloudinary integration
 */

import { BaseEntity, ServiceResponse } from './base.interface';

// File upload request interfaces
export interface FileUploadRequest {
  title?: string;
  description?: string;
  tags?: string[];
  purpose: 'profile' | 'test' | 'question' | 'answer' | 'template' | 'document';
  isPublic?: boolean;
  folder?: string;
}

export interface ImageUploadRequest extends FileUploadRequest {
  altText?: string;
  width?: number;
  height?: number;
  quality?: string | number;
  crop?: string;
  transformation?: any;
}

export interface AudioUploadRequest extends FileUploadRequest {
  bitRate?: number;
  duration?: number;
  format?: string;
}

export interface VideoUploadRequest extends FileUploadRequest {
  bitRate?: number;
  duration?: number;
  format?: string;
  quality?: string;
  thumbnail?: boolean;
}

export interface DocumentUploadRequest extends FileUploadRequest {
  documentType?: 'pdf' | 'doc' | 'docx' | 'txt';
  pages?: number;
}

// File upload response interfaces
export interface FileUploadResponse {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  originalFilename: string;
  filename: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  tags: string[];
  folder?: string;
  version: number;
  etag: string;
  signature: string;
  bytes: number;
  placeholder?: boolean;
}

export interface ImageUploadResponse extends FileUploadResponse {
  width: number;
  height: number;
  aspectRatio: number;
  dominantColors?: string[];
  hasTransparency?: boolean;
}

export interface AudioUploadResponse extends FileUploadResponse {
  duration: number;
  format: string;
  bitRate?: number;
  channels?: number;
  sampleRate?: number;
}

export interface VideoUploadResponse extends FileUploadResponse {
  duration: number;
  width: number;
  height: number;
  frameRate?: number;
  bitRate?: number;
  codec?: string;
  thumbnailUrl?: string;
}

export interface DocumentUploadResponse extends FileUploadResponse {
  pages?: number;
  documentType: string;
  textContent?: string;
}

// Upload validation interfaces
export interface FileValidationOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  allowedMimeTypes?: string[];
  required?: boolean;
  customValidation?: (file: Express.Multer.File) => { isValid: boolean; error?: string };
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileType?: 'image' | 'audio' | 'video' | 'document';
  fileSize?: number;
  mimeType?: string;
  extension?: string;
}

// Cloudinary upload options interface
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
  context?: Record<string, string>;
  face_coordinates?: string;
  custom_coordinates?: string;
  auto_tagging?: number;
  categorization?: string;
  detection?: string;
  similarity_search?: boolean;
  background_removal?: string;
  raw_convert?: string;
  flags?: string[];
  notification_url?: string;
  proxy?: string;
  return_delete_token?: boolean;
  colors?: boolean;
  faces?: boolean;
  image_metadata?: boolean;
  media_metadata?: boolean;
  use_filename_as_display_name?: boolean;
  discard_original_filename?: boolean;
  invalidate?: boolean;
  phash?: boolean;
  responsive_breakpoints?: any[];
}

// Upload service interfaces
export interface IUploadService {
  uploadFile(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<FileUploadResponse>>;
  uploadImage(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<ImageUploadResponse>>;
  uploadAudio(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<AudioUploadResponse>>;
  uploadVideo(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<VideoUploadResponse>>;
  uploadDocument(file: Express.Multer.File, options?: CloudinaryUploadOptions): Promise<ServiceResponse<DocumentUploadResponse>>;
  deleteFile(publicId: string): Promise<ServiceResponse<boolean>>;
  generateUrl(publicId: string, transformation?: any): string;
  validateFile(file: Express.Multer.File): FileValidationResult;
}

// Task1 Template interfaces (updated for file uploads)
export interface CreateTask1TemplateRequest {
  type: string;
  prompt: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  testType?: 'academic' | 'general_training';
}

export interface UpdateTask1TemplateRequest {
  type?: string;
  prompt?: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  testType?: 'academic' | 'general_training';
}

export interface Task1TemplateResponse extends BaseEntity {
  type: string;
  prompt: string;
  imageUrl: string;
  imagePublicId: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  difficulty?: string;
  testType?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bulk upload interfaces
export interface BulkUploadRequest {
  files: Express.Multer.File[];
  options?: CloudinaryUploadOptions;
  purpose: 'profile' | 'test' | 'question' | 'answer' | 'template' | 'document';
  tags?: string[];
  folder?: string;
}

export interface BulkUploadResponse {
  successful: FileUploadResponse[];
  failed: {
    filename: string;
    error: string;
    code: string;
  }[];
  totalFiles: number;
  successCount: number;
  failureCount: number;
  processingTime: number;
}

// Upload progress interfaces
export interface UploadProgress {
  uploadId: string;
  filename: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  bytesUploaded: number;
  totalBytes: number;
  speed?: number; // bytes per second
  estimatedTimeRemaining?: number; // seconds
  error?: string;
  startTime: Date;
  endTime?: Date;
}

// Upload history interfaces
export interface UploadHistoryEntry extends BaseEntity {
  filename: string;
  originalName: string;
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  purpose: string;
  tags: string[];
  folder?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface UploadHistoryFilter {
  userId?: string;
  purpose?: string;
  resourceType?: string;
  format?: string;
  tags?: string[];
  folder?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'size' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

// Upload quota interfaces
export interface UploadQuota {
  userId: string;
  totalUploads: number;
  totalSize: number;
  remainingUploads: number;
  remainingSize: number;
  maxUploads: number;
  maxSize: number;
  resetDate: Date;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
}

// Upload analytics interfaces
export interface UploadAnalytics {
  totalUploads: number;
  totalSize: number;
  averageFileSize: number;
  popularFormats: { format: string; count: number }[];
  uploadsByType: { type: string; count: number }[];
  uploadsByDate: { date: string; count: number }[];
  topUsers: { userId: string; username: string; uploadCount: number }[];
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Error interfaces
export interface UploadError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface UploadValidationError extends UploadError {
  validationErrors: {
    field: string;
    message: string;
    code: string;
  }[];
}

// Configuration interfaces
export interface UploadConfiguration {
  maxFileSize: number;
  allowedTypes: string[];
  allowedMimeTypes: string[];
  uploadPath: string;
  cloudinaryFolder: string;
  compressionQuality: number;
  generateThumbnails: boolean;
  autoOptimize: boolean;
  enableAnalytics: boolean;
  retentionPolicy: {
    enabled: boolean;
    days: number;
  };
  securityScanning: {
    enabled: boolean;
    scanViruses: boolean;
    scanMalware: boolean;
  };
} 
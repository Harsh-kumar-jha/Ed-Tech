import { config } from './environment';

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,mp3,mp4,wav').split(','),
  uploadPath: process.env.UPLOAD_PATH || './uploads',
}; 
import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { config } from './environment';

// Cloudinary configuration interface
export interface CloudinaryConfig extends ConfigOptions {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure: boolean;
}

// Cloudinary configuration
export const cloudinaryConfig: CloudinaryConfig = {
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: config.CLOUDINARY_SECURE,
};

// Initialize Cloudinary with configuration
cloudinary.config(cloudinaryConfig);

// Export the configured cloudinary instance
export { cloudinary };

// Validation function to check if Cloudinary is properly configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    cloudinaryConfig.cloud_name &&
    cloudinaryConfig.api_key &&
    cloudinaryConfig.api_secret
  );
};

// Configuration validation with detailed error messages
export const validateCloudinaryConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!cloudinaryConfig.cloud_name) {
    errors.push('CLOUDINARY_CLOUD_NAME environment variable is required');
  }
  
  if (!cloudinaryConfig.api_key) {
    errors.push('CLOUDINARY_API_KEY environment variable is required');
  }
  
  if (!cloudinaryConfig.api_secret) {
    errors.push('CLOUDINARY_API_SECRET environment variable is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 
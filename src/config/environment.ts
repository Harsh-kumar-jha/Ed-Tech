import dotenv from 'dotenv';
dotenv.config();

export interface Environment {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  UPLOAD_DIR: string;
  ALLOWED_ORIGINS: string;
  MAX_FILE_SIZE: number;
  LOG_LEVEL: string;
  API_VERSION: string;
  BCRYPT_SALT_ROUNDS: number;
  
  // Groq Configuration
  GROQ_API_KEY: string;
  GROQ_API_BASE_URL: string;

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  // Microsoft OAuth Configuration
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  MICROSOFT_CALLBACK_URL: string;
  MICROSOFT_TENANT_ID: string;

  // Brevo Configuration (Email OTP)
  BREVO_API_KEY: string;
  BREVO_SMS_SENDER: string;
  BREVO_EMAIL_SENDER: string;
  BREVO_EMAIL_SENDER_NAME: string;

  // 2Factor Configuration (SMS OTP)
  TWOFACTOR_API_KEY: string;
  TWOFACTOR_SMS_SENDER: string;
  TWOFACTOR_BASE_URL: string;

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_SECURE: boolean;
}

// Helper to determine the default callback URL based on environment
const getDefaultCallbackUrl = (path: string) => {
  const isDev = process.env.NODE_ENV === 'development';
  const protocol = isDev ? 'http' : 'https';
  const host = isDev ? 'localhost:3000' : process.env.APP_HOST || 'your-domain.com';
  return `${protocol}://${host}${path}`;
};

export const config: Environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  API_VERSION: process.env.API_VERSION || 'v1',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  
  // Groq Configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_API_BASE_URL: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',

  // Microsoft OAuth Configuration
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || '',
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || '',
  MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL || '/auth/microsoft/callback',
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || 'common',

  // Brevo Configuration (Email OTP)
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SMS_SENDER: process.env.BREVO_SMS_SENDER || 'IELTS EdTech',
  BREVO_EMAIL_SENDER: process.env.BREVO_EMAIL_SENDER || 'noreply@ielts-edtech.com',
  BREVO_EMAIL_SENDER_NAME: process.env.BREVO_EMAIL_SENDER_NAME || 'IELTS EdTech',

  // 2Factor Configuration (SMS OTP)
  TWOFACTOR_API_KEY: process.env.TWOFACTOR_API_KEY || '',
  TWOFACTOR_SMS_SENDER: process.env.TWOFACTOR_SMS_SENDER || '',
  TWOFACTOR_BASE_URL: process.env.TWOFACTOR_BASE_URL || '',

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_SECURE: process.env.CLOUDINARY_SECURE === 'true' || true,
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test'; 
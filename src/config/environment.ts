import dotenv from 'dotenv';
import { EnvironmentConfig } from '@/types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Application configuration
export const config: EnvironmentConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Password hashing
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // AI Configuration
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama2',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
};

// Derived configuration
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test'; 
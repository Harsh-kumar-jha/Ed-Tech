import { config, isDevelopment } from './environment';

// Database configuration
export const databaseConfig = {
  url: config.DATABASE_URL,
  logging: isDevelopment,
}; 
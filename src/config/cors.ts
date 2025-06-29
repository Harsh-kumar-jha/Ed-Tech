import { config } from './environment';

// CORS configuration
export const corsConfig = {
  origin: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}; 
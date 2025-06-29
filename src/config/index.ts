import { config,isDevelopment,isProduction,isTest } from './environment';
import { databaseConfig } from './database';
import { jwtConfig } from './jwt';
import { corsConfig } from './cors';
import { rateLimitConfig } from './rate-limit';
import { uploadConfig } from './upload';
import { aiConfig } from './ai';
import { socketConfig } from './socket';



// Environment Configuration
export {
  config,
  isDevelopment,
  isProduction,
  isTest
} from './environment';

// Database Configuration
export { databaseConfig } from './database';

// JWT Configuration
export { jwtConfig } from './jwt';

// CORS Configuration
export { corsConfig } from './cors';

// Rate Limiting Configuration
export { rateLimitConfig } from './rate-limit';

// File Upload Configuration
export { uploadConfig } from './upload';

// AI Configuration
export { aiConfig } from './ai';

// Socket.IO Configuration
export { socketConfig } from './socket';

// Re-export main config as default
export { config as default } from './environment'; 
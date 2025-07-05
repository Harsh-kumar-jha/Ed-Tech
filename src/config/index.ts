import { config } from './environment';
import { corsConfig } from './cors';
import { databaseConfig } from './database';
import { jwtConfig } from './jwt';
import passport from './passport';
import { socketConfig } from './socket';
import { openRouterConfig } from './ai';
import { uploadConfig } from './upload';
import { rateLimitConfig } from './rate-limit';

export {
  config,
  corsConfig,
  databaseConfig,
  jwtConfig,
  passport,
  socketConfig,
  openRouterConfig,
  uploadConfig,
  rateLimitConfig,
}; 
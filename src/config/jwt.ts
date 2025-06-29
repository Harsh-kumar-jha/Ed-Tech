import { config } from './environment';

// JWT configuration
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshSecret: process.env.JWT_REFRESH_SECRET || config.JWT_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
}; 
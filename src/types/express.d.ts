import { JWTPayload } from '../interface/JWTPayload';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
} 
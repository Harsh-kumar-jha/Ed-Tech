import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getPrisma } from '../../../db/database';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
    };
  }
}

export const adminRoleMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Access denied. Admin role required.',
      });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Role verification failed',
    });
    return;
  }
}; 
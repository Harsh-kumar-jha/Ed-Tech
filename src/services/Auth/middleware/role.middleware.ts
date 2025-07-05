import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../types/UserRole';

export const adminRoleMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'Access denied. Admin role required.',
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Role verification failed',
    });
  }
}; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { logError } from '../../../utils/logger';
import { logAuthOperation } from '../../../common';
import { config } from '../../../config/environment';

// Use centralized configuration with proper fallbacks
const JWT_SECRET = config.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`;
const JWT_REFRESH_EXPIRES_IN = config.JWT_REFRESH_EXPIRES_IN || '1d';
const BCRYPT_SALT_ROUNDS = config.BCRYPT_SALT_ROUNDS || 12;

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    // Log error without exposing password details
    logError('Password hashing failed', error, { component: 'AuthUtils' });
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logError('Password comparison failed', error, { component: 'AuthUtils' });
    return false;
  }
};

// JWT utilities
export const generateAccessToken = (user: any): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET);
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET);
};

export const generateTokens = (user: any): any => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  // Get expiry time from access token
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    return { userId: decoded.userId as string };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

// Extract token from request headers
export const extractTokenFromHeader = (authorization?: string): string | null => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.substring(7); // Remove 'Bearer ' prefix
};

// Simple authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new Error('No token provided');
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been invalidated');
    }

    const payload = verifyAccessToken(token);

    // Attach user to request
    (req as any).user = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };

    logAuthOperation('Token authentication', payload.userId, payload.email, true);
    next();
  } catch (error: any) {
    logAuthOperation('Token authentication failed', undefined, undefined, false, { error: error.message });
    res.status(401).json({
      success: false,
      error: {
        message: error.message,
        code: 'AUTHENTICATION_FAILED',
      },
    });
  }
};

// Simple role check
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access forbidden - insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
      });
    }

    next();
  };
};

// Placeholder functions for compatibility
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  next();
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};

export const generateSecureToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const { AuthModel } = await import('../../../models/Auth.model');
    const authModel = new AuthModel();
    const result = await authModel.isTokenBlacklisted(token);
    return result.success ? result.data : false;
  } catch (error) {
    logError('Failed to check token blacklist status', error, { token: token.substring(0, 20) + '...' });
    return false; // Assume token is valid if check fails
  }
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const { AuthModel } = await import('../../../models/Auth.model');
    const authModel = new AuthModel();
    await authModel.invalidateSession(token);
  } catch (error) {
    logError('Failed to blacklist token', error, { token: token.substring(0, 20) + '...' });
    throw new Error('Failed to blacklist token');
  }
};

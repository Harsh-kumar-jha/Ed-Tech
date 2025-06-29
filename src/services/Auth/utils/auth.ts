import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User, AuthTokens, AuthenticatedRequest } from '@/types';
import { AuthError, ForbiddenError } from '../../../utils/exceptions';
import { logError, logInfo } from '../../../utils/logger';

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

// JWT token payload interface
interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logError('Password hashing failed', error);
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logError('Password comparison failed', error);
    return false;
  }
};

// JWT utilities
export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ielts-edtech-platform',
    audience: 'ielts-users',
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ielts-edtech-platform',
    audience: 'ielts-users',
  });
};

export const generateTokens = (user: User): AuthTokens => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  // Get expiry time from access token
  const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'ielts-edtech-platform',
      audience: 'ielts-users',
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token');
    }
    throw new AuthError('Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ielts-edtech-platform',
      audience: 'ielts-users',
    }) as jwt.JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new AuthError('Invalid refresh token');
    }

    return { userId: decoded.userId as string };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid refresh token');
    }
    throw new AuthError('Refresh token verification failed');
  }
};

// Extract token from request headers
export const extractTokenFromHeader = (authorization?: string): string | null => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.substring(7); // Remove 'Bearer ' prefix
};

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AuthError('No token provided');
    }

    const payload = verifyAccessToken(token);

    // In a real application, you might want to fetch user from database
    // to ensure user still exists and is active
    const user: User = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role as any,
      firstName: '', // These would be fetched from database in real app
      lastName: '',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    logError('Authentication failed', error, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    if (error instanceof AuthError) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: 'AUTHENTICATION_FAILED',
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'SERVER_ERROR',
        },
      });
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);
      const user: User = {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role as any,
        firstName: '',
        lastName: '',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (req as AuthenticatedRequest).user = user;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

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
      logInfo('Access denied - insufficient role', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

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

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    // In a real application, you would check user permissions from database
    // This is a simplified version
    const userPermissions = getUserPermissions(user.role);

    if (!userPermissions.includes(permission)) {
      logInfo('Access denied - missing permission', {
        userId: user.id,
        userRole: user.role,
        requiredPermission: permission,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access forbidden - missing permission',
          code: 'MISSING_PERMISSION',
        },
      });
    }

    next();
  };
};

// Get user permissions based on role (simplified)
const getUserPermissions = (role: string): string[] => {
  const permissions: Record<string, string[]> = {
    student: ['test:read', 'test:submit', 'user:read', 'user:update'],
    instructor: ['test:create', 'test:read', 'test:update', 'test:grade', 'user:read', 'user:update'],
    admin: ['*'], // All permissions
    super_admin: ['*'], // All permissions
  };

  return permissions[role] || [];
};

// Security utilities
export const generateSecureToken = (): string => {
  return jwt.sign({ random: Math.random(), timestamp: Date.now() }, JWT_SECRET, { expiresIn: '1h' });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  // In a real application, you would check against a Redis blacklist
  // or database table of revoked tokens
  return false;
};

export const blacklistToken = async (token: string): Promise<void> => {
  // In a real application, you would add token to blacklist
  // with expiry time matching token expiry
  logInfo('Token blacklisted', { token: token.substring(0, 20) + '...' });
};

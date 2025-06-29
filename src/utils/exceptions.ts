import { Request, Response, NextFunction } from 'express';
import { logError } from './logger';

// Base custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errorCode?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errorCode !== undefined) {
      this.errorCode = errorCode;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true, 'VALIDATION_ERROR');
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTH_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, true, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    stack?: string;
  };
}

// Global error handler middleware
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode: string | undefined;

  // Handle custom AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
  }
  // Handle Joi validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    errorCode = 'VALIDATION_ERROR';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate entry found';
      errorCode = 'DUPLICATE_ENTRY';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      errorCode = 'RECORD_NOT_FOUND';
    }
  }
  // Handle syntax errors
  else if (error instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON syntax';
    errorCode = 'SYNTAX_ERROR';
  }

  // Log the error
  logError(`${req.method} ${req.path} - ${message}`, error, {
    statusCode,
    errorCode,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Add optional fields only if they exist
  if (errorCode) {
    errorResponse.error.code = errorCode;
  }
  if (req.path) {
    errorResponse.error.path = req.path;
  }
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle uncaught exceptions
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    logError('Uncaught Exception - Shutting down...', error);
    process.exit(1);
  });
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logError('Unhandled Rejection - Shutting down...', reason);
    process.exit(1);
  });
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}; 
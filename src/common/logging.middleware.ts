/**
 * Logging Middleware
 * Provides consistent logging across routes, controllers, and services
 */

import { Request, Response, NextFunction } from 'express';
import { logInfo, logError, logWarn } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with timing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;
  
  // Log request start
  logInfo('HTTP Request Started', {
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    contentType: headers['content-type'],
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log request completion
    logInfo('HTTP Request Completed', {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip,
      success: statusCode < 400
    });

    // Log errors for 4xx and 5xx status codes
    if (statusCode >= 400) {
      logWarn('HTTP Request Error Response', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip
      });
    }

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

/**
 * Controller action logger
 * To be used in controller methods
 */
export const logControllerAction = (
  controllerName: string, 
  action: string, 
  data?: any
) => {
  logInfo(`Controller Action: ${controllerName}.${action}`, {
    controller: controllerName,
    action,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Service operation logger
 * To be used in service methods
 */
export const logServiceOperation = (
  serviceName: string, 
  operation: string, 
  data?: any,
  success: boolean = true
) => {
  const logLevel = success ? logInfo : logError;
  logLevel(`Service Operation: ${serviceName}.${operation}`, {
    service: serviceName,
    operation,
    success,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware action logger
 * To be used in custom middleware
 */
export const logMiddlewareAction = (
  middlewareName: string, 
  action: string, 
  data?: any
) => {
  logInfo(`Middleware: ${middlewareName} - ${action}`, {
    middleware: middlewareName,
    action,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Database operation logger
 * To be used for database operations
 */
export const logDatabaseOperation = (
  operation: string,
  table?: string,
  data?: any,
  success: boolean = true,
  duration?: number
) => {
  const logLevel = success ? logInfo : logError;
  logLevel(`Database Operation: ${operation}`, {
    operation,
    ...(table && { table }),
    success,
    ...(duration && { duration: `${duration}ms` }),
    ...(data && { data }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Authentication logger
 * For auth-related operations
 */
export const logAuthOperation = (
  operation: string,
  userId?: string,
  email?: string,
  success: boolean = true,
  data?: any
) => {
  const logLevel = success ? logInfo : logWarn;
  logLevel(`Auth Operation: ${operation}`, {
    operation,
    ...(userId && { userId }),
    ...(email && { email }),
    success,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  });
}; 
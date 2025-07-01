/**
 * Response Service
 * Standardizes API response formatting across all controllers
 * Implements Single Responsibility Principle
 */

import { IResponseService } from '../interface/services.interface';

export class ResponseService implements IResponseService {
  readonly serviceName = 'ResponseService';

  /**
   * Format successful response
   */
  success<T>(data?: T, message?: string) {
    return {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message })
    };
  }

  /**
   * Format error response
   */
  error(message: string, code?: string, statusCode?: number) {
    return {
      success: false,
      error: {
        message,
        ...(code && { code })
      },
      ...(statusCode && { statusCode })
    };
  }

  /**
   * Format paginated response
   */
  paginated<T>(data: T[], meta: any) {
    return {
      success: true,
      data,
      meta: {
        page: meta.page || 1,
        limit: meta.limit || 20,
        total: meta.total || data.length,
        totalPages: meta.totalPages || Math.ceil((meta.total || data.length) / (meta.limit || 20))
      }
    };
  }

  /**
   * Format user response (removes sensitive data)
   */
  userResponse(user: any) {
    const { password, ...userWithoutPassword } = user;
    return this.success({
      user: {
        ...userWithoutPassword,
        role: user.role?.toLowerCase?.() || user.role
      }
    });
  }

  /**
   * Format authentication response
   */
  authResponse(user: any, tokens?: any, message?: string) {
    const { password, ...userWithoutPassword } = user;
    return this.success({
      user: {
        ...userWithoutPassword,
        role: user.role?.toLowerCase?.() || user.role
      },
      ...(tokens && { tokens })
    }, message);
  }
} 
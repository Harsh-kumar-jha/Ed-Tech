/**
 * Error Service
 * Centralizes error handling logic across all controllers
 * Implements Single Responsibility Principle
 */

import { Response } from 'express';
import { IErrorService } from '../interface/services.interface';
import { logError } from '../utils/logger';
import { ResponseService } from './response.service';

export class ErrorService implements IErrorService {
  readonly serviceName = 'ErrorService';
  private responseService = new ResponseService();

  /**
   * Handle and format errors consistently
   */
  handleError(error: any, res: Response, context?: any): void {
    logError('Error occurred', error, context);

    // Handle specific error types
    if (error.message?.includes('Email already exists')) {
      res.status(409).json(this.responseService.error('Email already exists', 'EMAIL_EXISTS'));
      return;
    }

    if (error.message?.includes('Username already exists')) {
      res.status(409).json(this.responseService.error('Username already exists', 'USERNAME_EXISTS'));
      return;
    }

    if (error.message?.includes('Invalid credentials') || error.message?.includes('Account is disabled')) {
      res.status(401).json(this.responseService.error(error.message, 'AUTHENTICATION_FAILED'));
      return;
    }

    if (error.message?.includes('Token')) {
      res.status(401).json(this.responseService.error(error.message, 'TOKEN_ERROR'));
      return;
    }

    // Default error response
    res.status(500).json(this.responseService.error(
      'Internal server error', 
      'INTERNAL_ERROR'
    ));
  }

  /**
   * Create standardized error objects
   */
  createError(message: string, code?: string, statusCode?: number): Error {
    const error = new Error(message) as any;
    if (code) error.code = code;
    if (statusCode) error.statusCode = statusCode;
    return error;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: any[], res: Response): void {
    res.status(400).json(this.responseService.error(
      'Validation failed',
      'VALIDATION_ERROR'
    ));
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(message: string, res: Response): void {
    res.status(401).json(this.responseService.error(message, 'AUTHENTICATION_FAILED'));
  }

  /**
   * Handle authorization errors
   */
  handleAuthorizationError(message: string, res: Response): void {
    res.status(403).json(this.responseService.error(message, 'AUTHORIZATION_FAILED'));
  }

  /**
   * Handle not found errors
   */
  handleNotFoundError(resource: string, res: Response): void {
    res.status(404).json(this.responseService.error(`${resource} not found`, 'NOT_FOUND'));
  }
} 
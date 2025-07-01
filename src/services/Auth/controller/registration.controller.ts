/**
 * Registration Controller
 * Handles only user registration operations (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../../interface/services.interface';
import { ResponseService, ErrorService, logControllerAction, logAuthOperation } from '../../../common';
import { logInfo } from '../../../utils/logger';

export class RegistrationController {
  constructor(
    private authService: IAuthService,
    private responseService = new ResponseService(),
    private errorService = new ErrorService()
  ) {}

  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, firstName, lastName, password, phone, role } = req.body;
      
      logControllerAction('RegistrationController', 'register', { email, username });
      logInfo('Registration request received', { email, username });

      // Create user in database with duplicate checking
      const result = await this.authService.createUser({
        email,
        username,
        firstName,
        lastName,
        password,
        phone,
        role: role || 'student'
      });

      if (!result.success || !result.data) {
        res.status(500).json(this.responseService.error(
          'User creation failed',
          'USER_CREATION_ERROR'
        ));
        return;
      }

      const user = result.data;
      
      logAuthOperation('User registration', user.id, email, true);
      
      res.status(201).json(this.responseService.success({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.profile?.phone || phone,
          role: user.role.toLowerCase(),
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }, 'User registered successfully. Please log in to get access tokens.'));
      
    } catch (error: any) {
      const { email } = req.body;
      logAuthOperation('User registration failed', undefined, email, false, { error: error.message });
      this.errorService.handleError(error, res, { email: req.body.email, username: req.body.username });
    }
  }
} 
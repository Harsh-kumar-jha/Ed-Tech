/**
 * Authentication Controller
 * Handles only authentication operations - login, logout, token refresh (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService, ITokenService } from '../../../interface/services.interface';
import { ResponseService, ErrorService } from '../../../common';
import { logInfo } from '../../../utils/logger';

export class AuthenticationController {
  constructor(
    private authService: IAuthService,
    private tokenService: ITokenService,
    private responseService = new ResponseService(),
    private errorService = new ErrorService()
  ) {}

  /**
   * Login with email/username and password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password } = req.body;
      
      logInfo('Login request received', { email, username });

      // Authenticate user with database
      const result = await this.authService.authenticateUser({
        email,
        username,
        password
      });

      if (!result.success || !result.data) {
        res.status(401).json(this.responseService.error(
          'Invalid credentials',
          'INVALID_CREDENTIALS'
        ));
        return;
      }

      const user = result.data;

      // Generate JWT tokens
      const tokens = this.tokenService.generateTokens(user as any);

      res.status(200).json(this.responseService.authResponse(
        user,
        tokens,
        'Login successful'
      ));
      
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        email: req.body.email, 
        username: req.body.username 
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json(this.responseService.error(
          'Refresh token is required',
          'MISSING_REFRESH_TOKEN'
        ));
        return;
      }

      // Verify refresh token
      const { userId } = this.tokenService.verifyRefreshToken(refreshToken);

      // Get user details
      const userResult = await this.authService.getUserById(userId);
      
      if (!userResult.success || !userResult.data) {
        res.status(401).json(this.responseService.error(
          'Invalid refresh token',
          'INVALID_REFRESH_TOKEN'
        ));
        return;
      }

      // Generate new tokens
      const tokens = this.tokenService.generateTokens(userResult.data as any);

      res.status(200).json(this.responseService.success({
        tokens
      }, 'Token refreshed successfully'));
      
    } catch (error: any) {
      this.errorService.handleError(error, res, { refreshToken: !!req.body.refreshToken });
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = this.tokenService.extractTokenFromHeader(req.headers.authorization);
      
      if (token) {
        await this.tokenService.blacklistToken(token);
      }

      res.status(200).json(this.responseService.success(
        null,
        'Logged out successfully'
      ));
      
    } catch (error: any) {
      this.errorService.handleError(error, res);
    }
  }
} 
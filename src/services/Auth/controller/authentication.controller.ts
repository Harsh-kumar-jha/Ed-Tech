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

      // Create session record in database for token tracking
      try {
        // Set token expiry based on JWT expiry (default 1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await this.authService.createSession(
          user.id,
          tokens.accessToken,
          expiresAt,
          req.get('User-Agent'),
          req.ip
        );
      } catch (sessionError) {
        // Log error but don't fail login if session creation fails
        logInfo('Failed to create session record during login', { 
          userId: user.id, 
          error: sessionError 
        });
      }

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
      
      if (!token) {
        res.status(400).json(this.responseService.error(
          'Access token is required for logout',
          'MISSING_TOKEN'
        ));
        return;
      }

      // Check if token is already blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        res.status(401).json(this.responseService.error(
          'Token is already invalidated. You are already logged out.',
          'TOKEN_ALREADY_INVALIDATED'
        ));
        return;
      }

      // Verify the token is valid before blacklisting
      try {
        this.tokenService.verifyAccessToken(token);
      } catch (error: any) {
        res.status(401).json(this.responseService.error(
          'Invalid or expired token',
          'INVALID_TOKEN'
        ));
        return;
      }

      // Blacklist the token
      await this.tokenService.blacklistToken(token);

      res.status(200).json(this.responseService.success(
        { tokenInvalidated: true },
        'Logged out successfully'
      ));
      
    } catch (error: any) {
      this.errorService.handleError(error, res);
    }
  }
} 
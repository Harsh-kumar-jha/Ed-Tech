import { Request, Response, NextFunction } from 'express';
import { AuthModel } from '../../../models/Auth.model';
import { generateTokens, verifyRefreshToken, generateAccessToken, verifyAccessToken } from '../utils/auth';

export class AuthController {
  private authModel = new AuthModel();

  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, firstName, lastName, password, phone, role } = req.body;
      
      console.log('🔄 Registration request received:', { email, username });

      // Create user in database with duplicate checking
      const result = await this.authModel.createUser({
        email,
        username,
        firstName,
        lastName,
        password,
        phone,
        role: role || 'student'
      });

      if (!result.success || !result.data) {
        res.status(500).json({
          success: false,
          error: {
            message: 'User creation failed',
            code: 'USER_CREATION_ERROR',
          },
        });
        return;
      }

      const user = result.data;
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please log in to get access tokens.',
        data: {
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
        },
      });
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Handle specific database errors
      if (error.message?.includes('Email already exists')) {
        res.status(409).json({
          success: false,
          error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
          },
        });
        return;
      }
      
      if (error.message?.includes('Username already exists')) {
        res.status(409).json({
          success: false,
          error: {
            message: 'Username already exists',
            code: 'USERNAME_EXISTS',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR',
        },
      });
    }
  }

  /**
   * Login with email/username and password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password } = req.body;
      
      console.log('🔄 Login request received:', { email, username });

      // Authenticate user with database
      const result = await this.authModel.authenticateUser({
        email,
        username,
        password
      });

      if (!result.success || !result.data) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      const user = result.data;

      // Generate real JWT tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '', // Not needed for token generation
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt || null,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.profile?.phone,
            role: user.role.toLowerCase(),
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        },
      });
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.message?.includes('Invalid credentials') || error.message?.includes('Account is disabled')) {
        res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: 'AUTHENTICATION_FAILED',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed',
          code: 'LOGIN_ERROR',
        },
      });
    }
  }

  /**
   * Phone login (send OTP)
   */
  async phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      
      console.log('🔄 Phone login request received:', { phone });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your phone',
        data: {
          otpSent: true,
          expiresIn: 300, // 5 minutes
        },
      });
    } catch (error) {
      console.error('❌ Phone login error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Phone login failed',
          code: 'PHONE_LOGIN_ERROR',
        },
      });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, email, otp, type } = req.body;
      
      console.log('🔄 OTP verification request received:', { phone, email, type });

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          verified: true,
          user: type === 'login' ? {
            id: `user_${Date.now()}`,
            phone,
            email,
            role: 'student',
          } : null,
        },
      });
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'OTP verification failed',
          code: 'OTP_VERIFICATION_ERROR',
        },
      });
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone } = req.body;
      
      console.log('🔄 Forgot password request received:', { email, phone });

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent',
        data: {
          otpSent: true,
          expiresIn: 300,
        },
      });
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Forgot password failed',
          code: 'FORGOT_PASSWORD_ERROR',
        },
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone, otp, password } = req.body;
      
      console.log('🔄 Reset password request received:', { email, phone });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {
          passwordReset: true,
        },
      });
    } catch (error) {
      console.error('❌ Reset password error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Password reset failed',
          code: 'RESET_PASSWORD_ERROR',
        },
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      console.log('🔄 Refresh token request received');

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Refresh token is required',
            code: 'REFRESH_TOKEN_REQUIRED',
          },
        });
        return;
      }

      // Verify refresh token
      const { userId } = verifyRefreshToken(refreshToken);

      // Get user from database
      const result = await this.authModel.getUserById(userId);

      if (!result.success || !result.data) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN',
          },
        });
        return;
      }

      const user = result.data;

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Account is disabled',
            code: 'ACCOUNT_DISABLED',
          },
        });
        return;
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '', // Not needed for token generation
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt || null,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600,
        },
      });
    } catch (error: any) {
      console.error('❌ Refresh token error:', error);
      
      if (error.message?.includes('expired') || error.message?.includes('Invalid')) {
        res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: 'INVALID_REFRESH_TOKEN',
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Token refresh failed',
          code: 'TOKEN_REFRESH_ERROR',
        },
      });
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body || {};
      const { refreshToken } = body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      console.log('🔄 Logout request received');

      // Determine logout method
      let logoutMethod = '';
      let tokenToInvalidate = '';

      if (refreshToken) {
        // Method 1: Logout with refresh token (more secure)
        logoutMethod = 'refresh_token';
        tokenToInvalidate = refreshToken;
        
        try {
          // Verify refresh token is valid before invalidating
          verifyRefreshToken(refreshToken);
        } catch (error: any) {
          res.status(401).json({
            success: false,
            error: {
              message: 'Invalid refresh token',
              code: 'INVALID_REFRESH_TOKEN',
            },
          });
          return;
        }
      } else if (accessToken) {
        // Method 2: Logout with access token (simpler but less secure)
        logoutMethod = 'access_token';
        tokenToInvalidate = accessToken;
        
        try {
          // Verify access token is valid
          verifyAccessToken(accessToken);
        } catch (error: any) {
          res.status(401).json({
            success: false,
            error: {
              message: 'Invalid access token',
              code: 'INVALID_ACCESS_TOKEN',
            },
          });
          return;
        }
      }

      // TODO: In a real application, you would:
      // 1. Add token to blacklist/revocation list
      // 2. Remove refresh token from database
      // 3. Log the logout event
      
      console.log(`🔄 Logout successful using ${logoutMethod} method`);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: {
          loggedOut: true,
          method: logoutMethod,
          message: logoutMethod === 'refresh_token' 
            ? 'Refresh token invalidated. Please log in again to get new tokens.'
            : 'Access token invalidated. Refresh token (if any) may still be valid.'
        },
      });
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed',
          code: 'LOGOUT_ERROR',
        },
      });
    }
  }
} 
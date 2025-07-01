/**
 * OTP Controller
 * Handles OTP-related operations with user verification
 */

import { Request, Response, NextFunction } from 'express';
import { ResponseService } from '../../../common/response.service';
import { ErrorService } from '../../../common/error.service';
import { OTPService, UserVerificationService } from '../services';
import { TokenService } from '../services/token.service';
import { logControllerAction, logAuthOperation } from '../../../common/logging.middleware';
import { logInfo } from '../../../utils/logger';
import { ServiceResponse } from '../../../interface';

export class OTPController {
  private responseService = new ResponseService();
  private errorService = new ErrorService();
  private otpService = new OTPService();
  private userVerificationService = new UserVerificationService();
  private tokenService = new TokenService();

  /**
   * Phone login (send OTP) - Enhanced with user verification
   */
  async phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      
      logControllerAction('OTPController', 'phoneLogin', { phone });
      logInfo('Phone login request received', { phone });

      if (!phone) {
        res.status(400).json(this.responseService.error(
          'Phone number is required',
          'MISSING_PHONE'
        ));
        return;
      }

      // Step 1: Check user verification status first
      const verificationResult = await this.userVerificationService.checkPhoneVerificationStatus(phone);
      
      if (!verificationResult.success) {
        logAuthOperation('Phone verification check failed', undefined, undefined, false, { 
          phone, 
          error: verificationResult.error 
        });
        res.status(500).json(this.responseService.error(
          'Failed to verify phone number status',
          'VERIFICATION_CHECK_FAILED'
        ));
        return;
      }

      const verificationStatus = verificationResult.data!;
      
      // Step 2: Handle different verification statuses
      if (!verificationStatus.canLogin) {
        logAuthOperation('Phone login blocked - user verification required', 
          verificationStatus.user?.id, undefined, false, { 
          phone, 
          actionRequired: verificationStatus.actionRequired,
          message: verificationStatus.message
        });

        // Return appropriate response based on action required
        const statusCode = verificationStatus.actionRequired === 'register' ? 404 : 403;
        
        res.status(statusCode).json({
          success: false,
          error: {
            message: verificationStatus.message,
            code: verificationStatus.actionRequired.toUpperCase()
          },
          data: {
            isRegistered: verificationStatus.isRegistered,
            isVerified: verificationStatus.isVerified,
            actionRequired: verificationStatus.actionRequired,
            user: verificationStatus.user ? {
              id: verificationStatus.user.id,
              email: verificationStatus.user.email,
              username: verificationStatus.user.username,
              isEmailVerified: verificationStatus.user.isEmailVerified,
              isActive: verificationStatus.user.isActive
            } : null
          }
        });
        return;
      }

      // Step 3: User is verified and can login - proceed with OTP generation
      logInfo('User verification passed, generating OTP', { 
        phone, 
        userId: verificationStatus.user?.id,
        actionRequired: verificationStatus.actionRequired 
      });

      const result = await this.otpService.generateOTP(phone, 'phone', 'login');
      
      if (!result.success) {
        logAuthOperation('Phone OTP generation failed', verificationStatus.user?.id, undefined, false, { 
          phone, 
          error: result.error 
        });
        res.status(500).json(this.responseService.error(
          result.error || 'Failed to send OTP',
          'OTP_GENERATION_FAILED'
        ));
        return;
      }

      // Step 4: Check if SMS was actually sent
      const otpSent = result.data?.sent || false;
      const hasMessageId = !!result.data?.messageId;

      // In development mode, treat as success even if SMS fails (for testing)
      const isDevelopment = process.env.NODE_ENV === 'development';
      const treatAsSuccess = otpSent || (isDevelopment && result.data?.otpId);

      if (!treatAsSuccess) {
        logAuthOperation('Phone OTP generation succeeded but SMS sending failed', 
          verificationStatus.user?.id, undefined, false, { 
          phone, 
          otpId: result.data?.otpId,
          sent: otpSent,
          messageId: result.data?.messageId,
          developmentMode: isDevelopment
        });
        
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to send OTP to your phone. Please try again or use email instead.',
            code: 'SMS_SEND_FAILED'
          },
          data: {
            otpGenerated: true,
            smsSent: false,
            canRetry: true,
            alternativeMethod: 'email'
          }
        });
        return;
      }

      // Step 5: Success response
      logAuthOperation('Phone OTP sent successfully', verificationStatus.user?.id, undefined, true, { 
        phone, 
        otpId: result.data?.otpId,
        sent: otpSent,
        messageId: result.data?.messageId,
        developmentMode: isDevelopment,
        developmentFallback: isDevelopment && !otpSent
      });

      res.status(200).json(this.responseService.success({
        otpSent: treatAsSuccess,
        otpId: result.data?.otpId,
        messageId: result.data?.messageId || (isDevelopment ? 'dev-mock-' + Date.now() : undefined),
        expiresIn: 300, // 5 minutes
        user: {
          id: verificationStatus.user?.id,
          firstName: verificationStatus.user?.firstName,
          lastName: verificationStatus.user?.lastName,
          phone: verificationStatus.user?.phone
        },
        ...(isDevelopment && !otpSent && {
          developmentNote: 'SMS sending failed - check console for OTP'
        })
      }, verificationStatus.message));
      
    } catch (error: any) {
      logAuthOperation('Phone OTP error', undefined, undefined, false, { 
        phone: req.body.phone, 
        error: error.message 
      });
      this.errorService.handleError(error, res, { phone: req.body.phone });
    }
  }

  /**
   * Verify OTP for phone login or password reset - Enhanced validation
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, email, otp, type } = req.body;
      const identifier = phone || email;
      const identifierType = phone ? 'phone' : 'email';
      
      logControllerAction('OTPController', 'verifyOTP', { phone, email, type });
      logInfo('OTP verification request received', { phone, email, type });

      if (!otp) {
        res.status(400).json(this.responseService.error(
          'OTP is required',
          'MISSING_OTP'
        ));
        return;
      }

      if (!identifier) {
        res.status(400).json(this.responseService.error(
          'Phone or email is required',
          'MISSING_IDENTIFIER'
        ));
        return;
      }

      // For phone verification, check user status again
      if (phone && type === 'login') {
        const verificationResult = await this.userVerificationService.checkPhoneVerificationStatus(phone);
        
        if (!verificationResult.success || !verificationResult.data?.canLogin) {
          logAuthOperation('OTP verification blocked - user verification failed', undefined, email, false, { 
            identifier,
            identifierType,
            type,
            error: 'User cannot login'
          });
          res.status(403).json(this.responseService.error(
            'Phone number verification failed. Please ensure your account is active and email is verified.',
            'VERIFICATION_FAILED'
          ));
          return;
        }
      }

      // Verify OTP using the actual service
      const result = await this.otpService.verifyOTP(
        identifier, 
        identifierType, 
        otp, 
        type || 'login'
      );

      if (!result.success) {
        logAuthOperation('OTP verification failed', undefined, email, false, { 
          identifier,
          identifierType,
          type,
          error: result.error 
        });
        res.status(401).json(this.responseService.error(
          result.error || 'Invalid or expired OTP',
          'INVALID_OTP'
        ));
        return;
      }

      const { user, verified } = result.data!;

      if (!verified) {
        logAuthOperation('OTP verification failed', user?.id, email, false, { 
          identifier,
          identifierType,
          type 
        });
        res.status(401).json(this.responseService.error(
          'OTP verification failed',
          'VERIFICATION_FAILED'
        ));
        return;
      }

      logAuthOperation('OTP verified successfully', user?.id, email, true, { 
        identifier,
        identifierType,
        type 
      });

      if (type === 'login' && user) {
        // Generate tokens for login
        const tokens = this.tokenService.generateTokens(user);
        res.status(200).json(this.responseService.authResponse(
          user,
          tokens,
          'OTP verification successful'
        ));
      } else {
        // For password reset or other purposes
        res.status(200).json(this.responseService.success({
          verified: true,
          canResetPassword: type === 'password_reset',
          user: user ? {
            id: user.id,
            email: user.email,
            username: user.username
          } : null
        }, 'OTP verification successful'));
      }
      
    } catch (error: any) {
      logAuthOperation('OTP verification error', undefined, req.body.email, false, { 
        phone: req.body.phone,
        email: req.body.email,
        type: req.body.type,
        error: error.message 
      });
      this.errorService.handleError(error, res, { 
        phone: req.body.phone, 
        email: req.body.email, 
        type: req.body.type 
      });
    }
  }

  /**
   * Generate email verification OTP
   */
  async generateEmailVerificationOTP(email: string): Promise<ServiceResponse<{ otpId: string; sent?: boolean; messageId?: string }>> {
    try {
      logControllerAction('OTPController', 'generateEmailVerificationOTP', { email });
      
      // Generate OTP for email verification
      const result = await this.otpService.generateOTP(email, 'email', 'email_verification');
      
      if (!result.success) {
        logAuthOperation('Email verification OTP generation failed', undefined, email, false, { 
          error: result.error 
        });
        return {
          success: false,
          error: result.error || 'Failed to generate email verification OTP'
        };
      }

      logAuthOperation('Email verification OTP sent', undefined, email, true, { 
        otpId: result.data?.otpId,
        sent: result.data?.sent 
      });

      return {
        success: true,
        data: result.data
      };
      
    } catch (error: any) {
      logAuthOperation('Email verification OTP error', undefined, email, false, { 
        error: error.message 
      });
      return {
        success: false,
        error: `Failed to send email verification OTP: ${error.message}`
      };
    }
  }

  /**
   * Verify email OTP and update user email verification status
   */
  async verifyEmailOTP(email: string, otp: string): Promise<ServiceResponse<{ user?: any; verified: boolean }>> {
    try {
      logControllerAction('OTPController', 'verifyEmailOTP', { email });
      
      // Verify OTP
      const result = await this.otpService.verifyOTP(email, 'email', otp, 'email_verification');
      
      if (!result.success || !result.data?.verified) {
        logAuthOperation('Email verification OTP failed', undefined, email, false, { 
          error: result.error 
        });
        return {
          success: false,
          error: result.error || 'Invalid or expired OTP'
        };
      }

      const user = result.data.user;
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update user email verification status in database
      const { AuthModel } = require('../../../models/Auth.model');
      const authModel = new AuthModel();
      const updateResult = await authModel.verifyEmail(user.id);
      
      if (!updateResult.success) {
        logAuthOperation('Email verification update failed', user.id, email, false, { 
          error: 'Database update failed'
        });
        return {
          success: false,
          error: 'Failed to update email verification status'
        };
      }

      logAuthOperation('Email verified successfully', user.id, email, true);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            isEmailVerified: true
          },
          verified: true
        }
      };
      
    } catch (error: any) {
      logAuthOperation('Email verification error', undefined, email, false, { 
        error: error.message 
      });
      return {
        success: false,
        error: `Email verification failed: ${error.message}`
      };
    }
  }
} 
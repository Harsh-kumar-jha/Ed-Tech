/**
 * Password Controller
 * Handles only password-related operations - forgot password, reset password (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService, IOTPService } from '../../../interface/services.interface';
import { ResponseService, ErrorService, logControllerAction, logAuthOperation } from '../../../common';
import { logInfo, logError } from '../../../utils/logger';

export class PasswordController {
  constructor(
    private authService: IAuthService,
    private otpService: IOTPService,
    private responseService = new ResponseService(),
    private errorService = new ErrorService()
  ) {}

  /**
   * Initiate forgot password process
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;
      const identifierType = email ? 'email' : 'phone';
      
      logControllerAction('PasswordController', 'forgotPassword', { email, phone });
      logInfo('Forgot password request received', { email, phone });

      if (!identifier) {
        res.status(400).json(this.responseService.error(
          'Email or phone is required',
          'MISSING_IDENTIFIER'
        ));
        return;
      }

      // Generate and send password reset OTP
      const result = await this.otpService.generateOTP(
        identifier, 
        identifierType, 
        'password_reset'
      );

      if (!result.success) {
        logAuthOperation('Password reset OTP generation failed', undefined, email, false, { 
          identifier,
          identifierType,
          error: result.error 
        });
        res.status(500).json(this.responseService.error(
          result.error || 'Failed to send password reset instructions',
          'PASSWORD_RESET_FAILED'
        ));
        return;
      }

      // Check if OTP was actually sent
      const otpSent = result.data?.sent || false;
      const hasMessageId = !!result.data?.messageId;

      if (!otpSent) {
        logAuthOperation('Password reset OTP generation succeeded but sending failed', undefined, email, false, { 
          identifier,
          identifierType,
          otpId: result.data?.otpId,
          sent: otpSent,
          messageId: result.data?.messageId 
        });
        
        res.status(500).json(this.responseService.error(
          `Failed to send password reset OTP via ${identifierType}. Please try again.`,
          'OTP_SEND_FAILED'
        ));
        return;
      }

      logAuthOperation('Password reset OTP sent successfully', undefined, email, true, { 
        identifier,
        identifierType,
        otpId: result.data?.otpId,
        sent: otpSent,
        messageId: result.data?.messageId 
      });

      res.status(200).json(this.responseService.success({
        resetInitiated: true,
        otpSent: otpSent,
        otpId: result.data?.otpId,
        messageId: result.data?.messageId,
        expiresIn: 300, // 5 minutes
        method: identifierType === 'email' ? 'email' : 'SMS'
      }, `Password reset OTP sent to your ${identifierType}`));
      
    } catch (error: any) {
      logAuthOperation('Password reset OTP error', undefined, req.body.email, false, { 
        email: req.body.email,
        phone: req.body.phone,
        error: error.message 
      });
      this.errorService.handleError(error, res, { 
        email: req.body.email, 
        phone: req.body.phone 
      });
    }
  }

  /**
   * Reset password using token or OTP
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, otp, email, phone, password, confirmPassword } = req.body;
      const identifier = email || phone;
      const identifierType = email ? 'email' : 'phone';
      
      logControllerAction('PasswordController', 'resetPassword', { 
        email, 
        phone, 
        hasToken: !!token, 
        hasOtp: !!otp 
      });

      if (password !== confirmPassword) {
        res.status(400).json(this.responseService.error(
          'Passwords do not match',
          'PASSWORD_MISMATCH'
        ));
        return;
      }

      if (!token && !otp) {
        res.status(400).json(this.responseService.error(
          'Reset token or OTP is required',
          'MISSING_RESET_CREDENTIAL'
        ));
        return;
      }

      // If using OTP, verify it first
      if (otp && identifier) {
        const otpResult = await this.otpService.verifyOTP(
          identifier,
          identifierType,
          otp,
          'password_reset'
        );

        if (!otpResult.success || !otpResult.data?.verified) {
          logAuthOperation('Password reset OTP verification failed', undefined, email, false, { 
            identifier,
            identifierType,
            error: otpResult.error 
          });
          res.status(401).json(this.responseService.error(
            otpResult.error || 'Invalid or expired OTP',
            'INVALID_OTP'
          ));
          return;
        }

        // OTP verified, now update password
        const user = otpResult.data.user;
        
        if (!user || !user.id) {
          logAuthOperation('Password reset failed - user not found in OTP result', undefined, email, false, { 
            identifier,
            identifierType 
          });
          res.status(400).json(this.responseService.error(
            'User not found for password reset',
            'USER_NOT_FOUND'
          ));
          return;
        }

                  // Actually update the password in the database
          try {
            const updateResult = await this.authService.updatePassword(user.id, password);
            
            if (!updateResult.success) {
              logAuthOperation('Password update failed', user.id, email, false, { 
                identifier,
                identifierType,
                error: 'Failed to update password in database'
              });
              res.status(500).json(this.responseService.error(
                'Failed to update password. Please try again.',
                'PASSWORD_UPDATE_FAILED'
              ));
              return;
            }

                        // Enhanced security: Invalidate all existing sessions to force re-login with new password
            try {
              const sessionResult = await this.authService.invalidateAllUserSessions(user.id);
              logInfo('User sessions invalidated after password reset', { 
                userId: user.id, 
                invalidatedSessions: sessionResult.data || 0 
              });
            } catch (sessionError) {
              // Log but don't fail the password reset if session invalidation fails
              logError('Failed to invalidate sessions during password reset', sessionError, { 
                userId: user.id 
              });
            }

            logAuthOperation('Password reset completed via OTP', user.id, email, true, { 
              identifier,
              identifierType 
            });

        res.status(200).json(this.responseService.success({
          passwordReset: true,
              method: 'otp',
              userId: user.id,
              message: 'Password has been reset successfully. Please log in with your new password.'
        }, 'Password reset successfully'));
        return;
          
        } catch (error: any) {
          logAuthOperation('Password reset error during update', user.id, email, false, { 
            identifier,
            identifierType,
            error: error.message 
          });
          res.status(500).json(this.responseService.error(
            'Failed to update password. Please try again.',
            'PASSWORD_UPDATE_ERROR'
          ));
          return;
        }
      }

      // If using token-based reset (traditional email link method)
      if (token) {
        // TODO: Implement token-based password reset logic
        // For now, return an error as this feature is not yet implemented
        logAuthOperation('Token-based password reset attempted but not implemented', undefined, email, false, { 
          email,
          error: 'Token-based reset not implemented' 
        });

        res.status(501).json(this.responseService.error(
          'Token-based password reset is not yet implemented. Please use OTP-based reset.',
          'FEATURE_NOT_IMPLEMENTED'
        ));
        return;
      }

      res.status(400).json(this.responseService.error(
        'Invalid reset method',
        'INVALID_RESET_METHOD'
      ));
      
    } catch (error: any) {
      logAuthOperation('Password reset error', undefined, req.body.email, false, { 
        email: req.body.email,
        phone: req.body.phone,
        hasToken: !!req.body.token,
        hasOtp: !!req.body.otp,
        error: error.message 
      });
      this.errorService.handleError(error, res, {
        email: req.body.email,
        phone: req.body.phone,
        hasToken: !!req.body.token,
        hasOtp: !!req.body.otp
      });
    }
  }
} 
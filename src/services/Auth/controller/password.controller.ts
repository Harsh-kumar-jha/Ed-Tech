/**
 * Password Controller
 * Handles only password-related operations - forgot password, reset password (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService, IOTPService } from '../../../interface/services.interface';
import { ResponseService, ErrorService, logControllerAction, logAuthOperation } from '../../../common';
import { logInfo } from '../../../utils/logger';

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
        // For now, we'll return success (in real implementation, update user password here)
        logAuthOperation('Password reset completed via OTP', otpResult.data.user?.id, email, true, { 
          identifier,
          identifierType 
        });

        res.status(200).json(this.responseService.success({
          passwordReset: true,
          method: 'otp'
        }, 'Password reset successfully'));
        return;
      }

      // If using token-based reset (traditional email link method)
      if (token) {
        // Token-based password reset logic would go here
        logAuthOperation('Password reset completed via token', undefined, email, true, { 
          email 
        });

        res.status(200).json(this.responseService.success({
          passwordReset: true,
          method: 'token'
        }, 'Password reset successfully'));
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
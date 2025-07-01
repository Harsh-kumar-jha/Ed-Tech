/**
 * Password Controller
 * Handles only password-related operations - forgot password, reset password (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService, IOTPService } from '../../../interface/services.interface';
import { ResponseService, ErrorService } from '../../../common';
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
      
      logInfo('Forgot password request received', { email, phone });

      if (!email && !phone) {
        res.status(400).json(this.responseService.error(
          'Email or phone is required',
          'MISSING_IDENTIFIER'
        ));
        return;
      }

      // For demo purposes, always return success
      // In production, you would send actual emails/SMS
      res.status(200).json(this.responseService.success({
        resetInitiated: true,
        expiresIn: 300, // 5 minutes
      }, 'Password reset instructions sent'));
      
    } catch (error: any) {
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
      
      logInfo('Reset password request received', { email, phone, hasToken: !!token, hasOtp: !!otp });

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

      // For demo purposes, always return success
      // In production, you would verify the token/OTP and update password
      res.status(200).json(this.responseService.success(
        null,
        'Password reset successfully'
      ));
      
    } catch (error: any) {
      this.errorService.handleError(error, res, {
        email: req.body.email,
        phone: req.body.phone,
        hasToken: !!req.body.token,
        hasOtp: !!req.body.otp
      });
    }
  }
} 
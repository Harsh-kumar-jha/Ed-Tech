/**
 * OTP Controller
 * Handles only OTP-related operations - phone login, OTP verification (Single Responsibility Principle)
 */

import { Request, Response, NextFunction } from 'express';
import { IOTPService, ITokenService } from '../../../interface/services.interface';
import { ResponseService, ErrorService } from '../../../common';
import { logInfo } from '../../../utils/logger';

export class OTPController {
  constructor(
    private otpService: IOTPService,
    private tokenService: ITokenService,
    private responseService = new ResponseService(),
    private errorService = new ErrorService()
  ) {}

  /**
   * Phone login (send OTP)
   */
  async phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      
      logInfo('Phone login request received', { phone });

      if (!phone) {
        res.status(400).json(this.responseService.error(
          'Phone number is required',
          'MISSING_PHONE'
        ));
        return;
      }

      // For demo purposes, always return success
      // In production, you would send actual SMS
      res.status(200).json(this.responseService.success({
        otpSent: true,
        expiresIn: 300, // 5 minutes
      }, 'OTP sent to your phone'));
      
    } catch (error: any) {
      this.errorService.handleError(error, res, { phone: req.body.phone });
    }
  }

  /**
   * Verify OTP for phone login or password reset
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, email, otp, type } = req.body;
      
      logInfo('OTP verification request received', { phone, email, type });

      if (!otp) {
        res.status(400).json(this.responseService.error(
          'OTP is required',
          'MISSING_OTP'
        ));
        return;
      }

      if (!phone && !email) {
        res.status(400).json(this.responseService.error(
          'Phone or email is required',
          'MISSING_IDENTIFIER'
        ));
        return;
      }

             // For demo purposes, always return success for specific OTP
       if (otp === '123456') {
         const mockUser = {
           id: 'demo-user-id',
           email: email || 'demo@example.com',
           username: 'demouser',
           firstName: 'Demo',
           lastName: 'User',
           password: '', // Not needed for token generation
           role: 'STUDENT' as any,
           isActive: true,
           isEmailVerified: true,
           emailVerifiedAt: new Date(),
           lastLoginAt: new Date(),
           createdAt: new Date(),
           updatedAt: new Date()
         };

         if (type === 'login') {
           const tokens = this.tokenService.generateTokens(mockUser);
          res.status(200).json(this.responseService.authResponse(
            mockUser,
            tokens,
            'OTP verification successful'
          ));
        } else {
          res.status(200).json(this.responseService.success({
            verified: true,
            canResetPassword: true
          }, 'OTP verification successful'));
        }
      } else {
        res.status(401).json(this.responseService.error(
          'Invalid or expired OTP',
          'INVALID_OTP'
        ));
      }
      
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        phone: req.body.phone, 
        email: req.body.email, 
        type: req.body.type 
      });
    }
  }
} 
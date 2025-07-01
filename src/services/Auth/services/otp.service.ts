/**
 * OTP Service Implementation
 * Handles OTP operations following the IOTPService interface
 */

import { IOTPService } from '../../../interface/services.interface';
import { ServiceResponse } from '../../../interface';
import { AuthModel } from '../../../models/Auth.model';

export class OTPService implements IOTPService {
  readonly serviceName = 'OTPService';
  private authModel = new AuthModel();

  async generateOTP(
    identifier: string, 
    identifierType: 'email' | 'phone', 
    purpose: string
  ): Promise<ServiceResponse<{ otpId: string }>> {
    return this.authModel.generateOTP(
      identifier, 
      identifierType, 
      purpose as 'login' | 'password_reset' | 'email_verification'
    );
  }

  async verifyOTP(
    identifier: string,
    identifierType: 'email' | 'phone',
    otp: string,
    purpose: string
  ): Promise<ServiceResponse<{ user?: any; verified: boolean }>> {
    return this.authModel.verifyOTP(
      identifier,
      identifierType,
      otp,
      purpose as 'login' | 'password_reset' | 'email_verification'
    );
  }
} 
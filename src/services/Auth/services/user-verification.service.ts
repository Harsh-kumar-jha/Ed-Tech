/**
 * User Verification Service Implementation
 * Handles user verification status checking following the IUserVerificationService interface
 * Follows Single Responsibility Principle - only handles user verification logic
 */

import { IUserVerificationService, UserVerificationStatus, UserBasicInfo, ServiceResponse } from '../../../interface/services.interface';
import { AuthModel } from '../../../models/Auth.model';
import { logInfo, logError } from '../../../utils/logger';
import { logServiceOperation } from '../../../common/logging.middleware';

export class UserVerificationService implements IUserVerificationService {
  readonly serviceName = 'UserVerificationService';
  private authModel = new AuthModel();

  /**
   * Check phone number verification status and determine what action user should take
   */
  async checkPhoneVerificationStatus(phone: string): Promise<ServiceResponse<UserVerificationStatus>> {
    try {
      logServiceOperation(this.serviceName, 'checkPhoneVerificationStatus', { 
        phone: this.maskPhone(phone) 
      });

      // Clean phone number for consistent checking
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      // Get user by phone number
      const userResult = await this.getUserByPhone(cleanPhone);
      
      if (!userResult.success) {
        return {
          success: false,
          error: userResult.error || 'Failed to check phone verification status'
        };
      }

      const user = userResult.data;

      let verificationStatus: UserVerificationStatus;

      if (!user) {
        // Phone number not registered
        verificationStatus = {
          isRegistered: false,
          isVerified: false,
          canLogin: false,
          message: 'Phone number not registered. Please create an account first.',
          actionRequired: 'register'
        };
      } else if (!user.isActive) {
        // User account is inactive
        verificationStatus = {
          isRegistered: true,
          isVerified: false,
          canLogin: false,
          user,
          message: 'Your account is inactive. Please contact support.',
          actionRequired: 'account_inactive'
        };
      } else if (!user.isEmailVerified) {
        // User registered but email not verified
        verificationStatus = {
          isRegistered: true,
          isVerified: false,
          canLogin: false,
          user,
          message: 'Please verify your email address before using phone login.',
          actionRequired: 'verify_email'
        };
      } else {
        // User is registered, active, and verified - can login
        verificationStatus = {
          isRegistered: true,
          isVerified: true,
          canLogin: true,
          user,
          message: 'Phone number verified. OTP will be sent for login.',
          actionRequired: 'login'
        };
      }

      logServiceOperation(this.serviceName, 'checkPhoneVerificationStatus', { 
        phone: this.maskPhone(phone),
        isRegistered: verificationStatus.isRegistered,
        canLogin: verificationStatus.canLogin,
        actionRequired: verificationStatus.actionRequired,
        success: true
      });

      return {
        success: true,
        data: verificationStatus
      };

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'checkPhoneVerificationStatus', { 
        error: error.message,
        phone: this.maskPhone(phone)
      }, false);

      return {
        success: false,
        error: `Failed to check phone verification status: ${error.message}`
      };
    }
  }

  /**
   * Check if phone number is registered (simple boolean check)
   */
  async isPhoneNumberRegistered(phone: string): Promise<ServiceResponse<boolean>> {
    try {
      logServiceOperation(this.serviceName, 'isPhoneNumberRegistered', { 
        phone: this.maskPhone(phone) 
      });

      const cleanPhone = this.cleanPhoneNumber(phone);
      const userResult = await this.getUserByPhone(cleanPhone);
      
      if (!userResult.success) {
        return {
          success: false,
          error: userResult.error || 'Failed to check phone registration'
        };
      }

      const isRegistered = !!userResult.data;

      logServiceOperation(this.serviceName, 'isPhoneNumberRegistered', { 
        phone: this.maskPhone(phone),
        isRegistered,
        success: true
      });

      return {
        success: true,
        data: isRegistered
      };

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'isPhoneNumberRegistered', { 
        error: error.message,
        phone: this.maskPhone(phone)
      }, false);

      return {
        success: false,
        error: `Failed to check phone registration: ${error.message}`
      };
    }
  }

  /**
   * Get user by phone number with cleaned format
   */
  async getUserByPhone(phone: string): Promise<ServiceResponse<UserBasicInfo | null>> {
    try {
      logServiceOperation(this.serviceName, 'getUserByPhone', { 
        phone: this.maskPhone(phone) 
      });

      const cleanPhone = this.cleanPhoneNumber(phone);
      const userResult = await this.authModel.getUserByPhone(cleanPhone);
      
      if (!userResult.success) {
        return {
          success: false,
          error: userResult.error || 'Failed to get user by phone'
        };
      }

      const user = userResult.data;
      let userBasicInfo: UserBasicInfo | null = null;

      if (user) {
        userBasicInfo = {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.profile?.phone,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          role: user.role.toLowerCase()
        };
      }

      logServiceOperation(this.serviceName, 'getUserByPhone', { 
        phone: this.maskPhone(phone),
        userFound: !!userBasicInfo,
        success: true
      });

      return {
        success: true,
        data: userBasicInfo
      };

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'getUserByPhone', { 
        error: error.message,
        phone: this.maskPhone(phone)
      }, false);

      return {
        success: false,
        error: `Failed to get user by phone: ${error.message}`
      };
    }
  }

  /**
   * Clean and normalize phone number for consistent database queries
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Normalize to +91XXXXXXXXXX format for consistent storage/lookup
    if (cleaned.startsWith('+91')) {
      return cleaned;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return '+91' + cleaned;
    }
    
    return cleaned; // Return as-is if doesn't match expected patterns
  }

  /**
   * Mask phone number for logging (privacy protection)
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    const start = phone.substring(0, 2);
    const end = phone.substring(phone.length - 2);
    const middle = '*'.repeat(phone.length - 4);
    return `${start}${middle}${end}`;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return true; // Service is stateless, always healthy if no errors
    } catch (error) {
      logError('User verification service health check failed', error);
      return false;
    }
  }
} 
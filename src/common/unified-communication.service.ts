/**
 * Unified Communication Service
 * Uses Brevo for Email OTP (unchanged) and 2Factor for SMS OTP
 * Maintains backward compatibility with existing email configuration
 */

import { 
  ICommunicationService, 
  ServiceResponse, 
  SMSOptions, 
  EmailOptions, 
  EmailContent, 
  SMSSendResult, 
  EmailSendResult 
} from '../interface/services.interface';
import { BrevoCommunicationService } from './communication.service';
import { TwoFactorSMSService } from './twofactor-sms.service';
import { logInfo, logError } from '../utils/logger';
import { logServiceOperation } from './logging.middleware';

export class UnifiedCommunicationService implements ICommunicationService {
  readonly serviceName = 'UnifiedCommunicationService';
  
  private brevoService: BrevoCommunicationService;
  private twoFactorService: TwoFactorSMSService;

  constructor() {
    this.brevoService = new BrevoCommunicationService();
    this.twoFactorService = new TwoFactorSMSService();
    
    logInfo('Unified communication service initialized', { 
      service: this.serviceName,
      emailProvider: 'Brevo',
      smsProvider: '2Factor'
    });
  }

  /**
   * Send SMS via 2Factor service
   */
  async sendSMS(
    to: string, 
    message: string, 
    options?: SMSOptions
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendSMS', { 
        to: this.maskPhone(to), 
        provider: '2Factor' 
      });

      return await this.twoFactorService.sendSMS(to, message, options);
    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendSMS', { 
        error: error.message,
        provider: '2Factor'
      }, false);

      return {
        success: false,
        error: `SMS sending failed: ${error.message}`
      };
    }
  }

  /**
   * Send Email via Brevo service (unchanged from existing implementation)
   */
  async sendEmail(
    to: string, 
    subject: string, 
    content: EmailContent, 
    options?: EmailOptions
  ): Promise<ServiceResponse<EmailSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendEmail', { 
        to: this.maskEmail(to), 
        subject,
        provider: 'Brevo' 
      });

      return await this.brevoService.sendEmail(to, subject, content, options);
    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendEmail', { 
        error: error.message,
        provider: 'Brevo'
      }, false);

      return {
        success: false,
        error: `Email sending failed: ${error.message}`
      };
    }
  }

  /**
   * Send OTP via SMS using 2Factor
   */
  async sendOTPSMS(
    phone: string, 
    otp: string, 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { 
        phone: this.maskPhone(phone), 
        purpose,
        provider: '2Factor'
      });

      return await this.twoFactorService.sendOTPSMS(phone, otp, purpose);
    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { 
        error: error.message,
        phone: this.maskPhone(phone),
        purpose,
        provider: '2Factor'
      }, false);

      return {
        success: false,
        error: `SMS OTP sending failed: ${error.message}`
      };
    }
  }

  /**
   * Send OTP via Email using Brevo (unchanged from existing implementation)
   */
  async sendOTPEmail(
    email: string, 
    otp: string, 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<EmailSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendOTPEmail', { 
        email: this.maskEmail(email), 
        purpose,
        provider: 'Brevo'
      });

      return await this.brevoService.sendOTPEmail(email, otp, purpose);
    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendOTPEmail', { 
        error: error.message,
        email: this.maskEmail(email),
        purpose,
        provider: 'Brevo'
      }, false);

      return {
        success: false,
        error: `Email OTP sending failed: ${error.message}`
      };
    }
  }

  /**
   * Health check for both services
   */
  async healthCheck(): Promise<boolean> {
    try {
      const brevoHealth = await this.brevoService.healthCheck();
      const twoFactorHealth = await this.twoFactorService.healthCheck();
      
      const isHealthy = brevoHealth && twoFactorHealth;
      
      logInfo('Communication services health check', {
        brevoService: brevoHealth,
        twoFactorService: twoFactorHealth,
        overall: isHealthy
      });

      return isHealthy;
    } catch (error) {
      logError('Communication services health check failed', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    smsProvider: string;
    emailProvider: string;
    smsHealth: boolean;
    emailHealth: boolean;
  } {
    return {
      smsProvider: '2Factor',
      emailProvider: 'Brevo', 
      smsHealth: true, // You can make this async if needed
      emailHealth: true
    };
  }

  /**
   * Verify OTP using 2Factor API (optional additional verification)
   */
  async verifyOTPWithProvider(sessionId: string, otp: string): Promise<ServiceResponse<{ verified: boolean }>> {
    try {
      return await this.twoFactorService.verifyOTP(sessionId, otp);
    } catch (error: any) {
      return {
        success: false,
        error: `OTP verification failed: ${error.message}`
      };
    }
  }

  /**
   * Mask phone number for logging
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    const start = phone.substring(0, 2);
    const end = phone.substring(phone.length - 2);
    const middle = '*'.repeat(phone.length - 4);
    return `${start}${middle}${end}`;
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    const maskedLocal = local.substring(0, 2) + '*'.repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  }
} 
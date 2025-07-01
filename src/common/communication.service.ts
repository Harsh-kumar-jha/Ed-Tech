/**
 * Brevo Communication Service
 * Handles SMS and Email sending through Brevo API
 * Follows dependency injection and error handling best practices
 */

import axios from 'axios';
import { 
  ICommunicationService, 
  ServiceResponse, 
  SMSOptions, 
  EmailOptions, 
  EmailContent, 
  SMSSendResult, 
  EmailSendResult 
} from '../interface/services.interface';
import { config } from '../config/environment';
import { logInfo, logError, logWarn } from '../utils/logger';
import { logServiceOperation } from './logging.middleware';

export class BrevoCommunicationService implements ICommunicationService {
  readonly serviceName = 'BrevoCommunicationService';
  private brevoApiUrl = 'https://api.brevo.com/v3';
  private isInitialized = false;

  constructor() {
    this.initializeBrevo();
  }

  /**
   * Initialize Brevo service
   */
  private initializeBrevo(): void {
    try {
      if (!config.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY is required');
      }
      
      this.isInitialized = true;
      logInfo('Brevo communication service initialized successfully', { 
        service: this.serviceName 
      });
    } catch (error) {
      logError('Failed to initialize Brevo communication service', error, { 
        service: this.serviceName 
      });
      throw new Error('Failed to initialize communication service');
    }
  }

  /**
   * Send SMS via Brevo
   */
  async sendSMS(
    to: string, 
    message: string, 
    options?: SMSOptions
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendSMS', { to, hasMessage: !!message });

      if (!this.isInitialized) {
        throw new Error('Brevo service not initialized');
      }

      // Validate phone number format (basic validation)
      const cleanPhone = this.cleanPhoneNumber(to);
      if (!this.isValidPhoneNumber(cleanPhone)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const smsData = {
        type: 'transactional',
        unicodeEnabled: true,
        recipient: cleanPhone,
        content: message,
        sender: options?.sender || config.BREVO_SMS_SENDER,
        tag: options?.tag
      };

      const result = await axios.post(
        `${this.brevoApiUrl}/transactionalSMS/sms`,
        smsData,
        {
          headers: {
            'accept': 'application/json',
            'api-key': config.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
      
      logServiceOperation(this.serviceName, 'sendSMS', { 
        messageId: result.data?.messageId,
        recipient: cleanPhone,
        success: true 
      });

      return {
        success: true,
        data: {
          messageId: result.data?.messageId || '',
          status: 'sent',
          creditsUsed: result.data?.usedCredits,
          recipient: cleanPhone
        }
      };

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendSMS', { 
        error: error.message,
        to 
      }, false);

      return {
        success: false,
        error: `Failed to send SMS: ${error.message}`
      };
    }
  }

  /**
   * Send Email via Brevo
   */
  async sendEmail(
    to: string, 
    subject: string, 
    content: EmailContent, 
    options?: EmailOptions
  ): Promise<ServiceResponse<EmailSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendEmail', { 
        to, 
        subject,
        contentType: content.type 
      });

      if (!this.isInitialized) {
        throw new Error('Brevo service not initialized');
      }

      // Validate email format
      if (!this.isValidEmail(to)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      const emailData: any = {
        to: [{ email: to }],
        sender: options?.sender || {
          email: config.BREVO_EMAIL_SENDER,
          name: config.BREVO_EMAIL_SENDER_NAME
        },
        subject,
        tags: options?.tags || ['otp', 'authentication']
      };

      // Handle different content types
      if (content.type === 'html') {
        emailData.htmlContent = content.content;
        if (content.textContent) {
          emailData.textContent = content.textContent;
        }
      } else if (content.type === 'template') {
        emailData.templateId = options?.templateId;
        emailData.params = options?.params || {};
      } else {
        emailData.textContent = content.content;
      }

      if (options?.replyTo) {
        emailData.replyTo = { email: options.replyTo };
      }

      console.log('Brevo Email Request:', {
        url: `${this.brevoApiUrl}/smtp/email`,
        data: emailData,
        headers: {
          'accept': 'application/json',
          'api-key': config.BREVO_API_KEY?.substring(0, 10) + '...',
          'content-type': 'application/json'
        }
      });

      const result = await axios.post(
        `${this.brevoApiUrl}/smtp/email`,
        emailData,
        {
          headers: {
            'accept': 'application/json',
            'api-key': config.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
      
      console.log('Brevo Email Response:', result.data);
      
      logServiceOperation(this.serviceName, 'sendEmail', { 
        messageId: result.data?.messageId,
        recipient: to,
        success: true 
      });

      return {
        success: true,
        data: {
          messageId: result.data?.messageId || '',
          status: 'sent',
          recipient: to
        }
      };

    } catch (error: any) {
      console.error('Brevo Email Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      logServiceOperation(this.serviceName, 'sendEmail', { 
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        to,
        subject 
      }, false);

      return {
        success: false,
        error: `Failed to send email: ${error.message}${error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : ''}`
      };
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTPSMS(
    phone: string, 
    otp: string, 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { phone, purpose });

      const message = this.formatOTPSMS(otp, purpose);
      const options: SMSOptions = {
        tag: `otp_${purpose}`,
        sender: config.BREVO_SMS_SENDER
      };

      return await this.sendSMS(phone, message, options);

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { 
        error: error.message,
        phone,
        purpose 
      }, false);

      return {
        success: false,
        error: `Failed to send OTP SMS: ${error.message}`
      };
    }
  }

  /**
   * Send OTP via Email
   */
  async sendOTPEmail(
    email: string, 
    otp: string, 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<EmailSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendOTPEmail', { email, purpose });

      const { subject, htmlContent, textContent } = this.formatOTPEmail(otp, purpose);
      
      const content: EmailContent = {
        type: 'html',
        content: htmlContent,
        textContent: textContent
      };

      const options: EmailOptions = {
        tags: ['otp', 'authentication', purpose],
        sender: {
          email: config.BREVO_EMAIL_SENDER,
          name: config.BREVO_EMAIL_SENDER_NAME
        }
      };

      return await this.sendEmail(email, subject, content, options);

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendOTPEmail', { 
        error: error.message,
        email,
        purpose 
      }, false);

      return {
        success: false,
        error: `Failed to send OTP email: ${error.message}`
      };
    }
  }

  /**
   * Format OTP SMS message
   */
  private formatOTPSMS(otp: string, purpose: string): string {
    const purposeMap = {
      'login': 'login to your account',
      'password_reset': 'reset your password',
      'email_verification': 'verify your email'
    };

    const action = purposeMap[purpose as keyof typeof purposeMap] || 'authentication';
    
    return `Your EdTech OTP for ${action} is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  }

  /**
   * Format OTP Email content
   */
  private formatOTPEmail(otp: string, purpose: string): {
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    const purposeMap = {
      'login': 'Login Verification',
      'password_reset': 'Password Reset',
      'email_verification': 'Email Verification'
    };

    const purposeText = {
      'login': 'login to your account',
      'password_reset': 'reset your password',
      'email_verification': 'verify your email address'
    };

    const subject = `${purposeMap[purpose as keyof typeof purposeMap]} - OTP Code`;
    const action = purposeText[purpose as keyof typeof purposeText];

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background-color: #f8f9fa; }
    .otp-code { background-color: #e9ecef; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 20px 0; }
    .footer { padding: 20px; font-size: 12px; color: #6c757d; text-align: center; }
    .warning { color: #dc3545; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EdTech Platform</h1>
    </div>
    <div class="content">
      <h2>Your OTP Code</h2>
      <p>You requested an OTP to ${action}. Please use the following code:</p>
      <div class="otp-code">${otp}</div>
      <p><strong>This code will expire in 5 minutes.</strong></p>
      <div class="warning">
        🔒 For your security, do not share this code with anyone.
      </div>
    </div>
    <div class="footer">
      <p>If you didn't request this code, please ignore this email or contact support.</p>
      <p>© ${new Date().getFullYear()} EdTech Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
EdTech Platform - ${subject}

Your OTP Code: ${otp}

You requested an OTP to ${action}. This code will expire in 5 minutes.

For your security, do not share this code with anyone.

If you didn't request this code, please ignore this email or contact support.

© ${new Date().getFullYear()} EdTech Platform. All rights reserved.
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Clean and format phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's a local number and add country code
    if (!cleaned.startsWith('+')) {
      // Add default country code (you might want to make this configurable)
      cleaned = '+91' + cleaned; // Default to India, adjust as needed
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic international phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized;
    } catch (error) {
      logError('Communication service health check failed', error);
      return false;
    }
  }
} 
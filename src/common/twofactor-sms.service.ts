/**
 * 2Factor SMS Service
 * Handles SMS OTP sending through 2Factor API for phone number verification
 * Works alongside Brevo service for email OTP
 */

import axios from 'axios';
import { 
  ICommunicationService, 
  ServiceResponse, 
  SMSOptions, 
  SMSSendResult 
} from '../interface/services.interface';
import { config } from '../config/environment';
import { logInfo, logError, logWarn } from '../utils/logger';
import { logServiceOperation } from './logging.middleware';

export class TwoFactorSMSService {
  readonly serviceName = 'TwoFactorSMSService';
  private apiBaseUrl = config.TWOFACTOR_BASE_URL;
  private isInitialized = false;

  constructor() {
    this.initializeTwoFactor();
  }

  /**
   * Initialize 2Factor service
   */
  private initializeTwoFactor(): void {
    try {
      if (!config.TWOFACTOR_API_KEY) {
        throw new Error('TWOFACTOR_API_KEY is required');
      }
      
      this.isInitialized = true;
      logInfo('2Factor SMS service initialized successfully', { 
        service: this.serviceName 
      });
    } catch (error) {
      logError('Failed to initialize 2Factor SMS service', error, { 
        service: this.serviceName 
      });
      throw new Error('Failed to initialize SMS service');
    }
  }

  /**
   * Send OTP via 2Factor API (SMS Text Message Delivery)
   */
  async sendSMS(
    to: string, 
    message: string, 
    options?: SMSOptions
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendSMS', { 
        to: this.maskPhoneNumber(to), 
        hasMessage: !!message,
        deliveryMethod: 'SMS text message (2Factor)'
      });

      if (!this.isInitialized) {
        throw new Error('2Factor service not initialized');
      }

      // Debug: Log environment variables (masked)
      logInfo('2Factor Environment Check', {
        hasApiKey: !!config.TWOFACTOR_API_KEY,
        apiKeyLength: config.TWOFACTOR_API_KEY?.length || 0,
        baseUrl: config.TWOFACTOR_BASE_URL,
        sender: config.TWOFACTOR_SMS_SENDER,
        deliveryMethod: 'SMS text message'
      });

      // Clean and validate phone number
      const cleanPhone = this.cleanPhoneNumber(to);
      logInfo('Phone number processing', {
        original: this.maskPhoneNumber(to),
        cleaned: this.maskPhoneNumber(cleanPhone),
        isValid: this.isValidPhoneNumber(cleanPhone),
        deliveryMethod: 'SMS text message'
      });

      if (!this.isValidPhoneNumber(cleanPhone)) {
        return {
          success: false,
          error: `Invalid phone number format for 2Factor service. Expected +91XXXXXXXXXX, got: ${this.maskPhoneNumber(cleanPhone)}`
        };
      }

      // 2Factor API endpoint - delivers OTP via SMS text message
      // Remove the + symbol from phone number for URL (2Factor API requirement)
      const phoneForUrl = cleanPhone.replace('+', ''); // +919876543210 -> 919876543210
      
      // For message, we need to handle special characters carefully
      const encodedMessage = encodeURIComponent(message);
      const encodedSender = encodeURIComponent(config.TWOFACTOR_SMS_SENDER);
      
      const url = `${this.apiBaseUrl}/${config.TWOFACTOR_API_KEY}/SMS/${phoneForUrl}/${encodedMessage}/${encodedSender}`;
      
      // Debug: Log the EXACT API call (with masked API key)
      const maskedUrl = url.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY.slice(-4)}`);
      logInfo('2Factor API Call (SMS Delivery)', {
        url: maskedUrl,
        method: 'GET',
        phone: phoneForUrl,
        originalPhone: cleanPhone,
        messagePreview: message.substring(0, 50) + '...',
        messageLength: message.length,
        sender: config.TWOFACTOR_SMS_SENDER,
        deliveryMethod: 'SMS text message',
        note: 'This will be delivered as SMS text message'
      });

      const result = await axios.get(url, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logInfo('2Factor API Response', {
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        deliveryMethod: 'SMS text message'
      });

      // 2Factor API response format: {"Status":"Success","Details":"SessionId"}
      const responseData = result.data;

      if (responseData.Status === 'Success') {
        logInfo('OTP SMS sent successfully', {
          sessionId: responseData.Details,
          recipient: this.maskPhoneNumber(cleanPhone),
          deliveryMethod: 'SMS text message'
        });

        logServiceOperation(this.serviceName, 'sendSMS', { 
          sessionId: responseData.Details,
          recipient: this.maskPhoneNumber(cleanPhone),
          deliveryMethod: 'SMS text message',
          success: true 
        });

        return {
          success: true,
          data: {
            messageId: responseData.Details || '', // SessionId from 2Factor
            status: 'sent',
            recipient: this.maskPhoneNumber(cleanPhone)
          }
        };
      } else {
        throw new Error(`2Factor API error: ${responseData.Details || 'Unknown error'}`);
      }

    } catch (error: any) {
      // Enhanced error logging with MORE details
      logError('2Factor SMS Error Details', error, {
        errorType: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        httpStatus: error.response?.status,
        httpStatusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestUrl: error.config?.url?.replace(config.TWOFACTOR_API_KEY || '', `***${config.TWOFACTOR_API_KEY?.slice(-4) || ''}`),
        requestMethod: error.config?.method,
        requestTimeout: error.config?.timeout,
        to: this.maskPhoneNumber(to),
        hasApiKey: !!config.TWOFACTOR_API_KEY,
        apiKeyLength: config.TWOFACTOR_API_KEY?.length,
        baseUrl: config.TWOFACTOR_BASE_URL,
        sender: config.TWOFACTOR_SMS_SENDER,
        deliveryMethod: 'SMS text message',
        possibleCauses: this.analyzePossibleCauses(error),
        fullErrorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });

      logServiceOperation(this.serviceName, 'sendSMS', { 
        error: error.message,
        errorCode: error.code,
        httpStatus: error.response?.status,
        to: this.maskPhoneNumber(to),
        deliveryMethod: 'SMS text message'
      }, false);

      return {
        success: false,
        error: `Failed to send OTP SMS: ${error.message}${error.response?.data ? ` (API Response: ${JSON.stringify(error.response.data)})` : ''}`
      };
    }
  }

  /**
   * Send OTP via 2Factor SMS API
   * Uses our database-generated OTP to ensure verification works correctly
   */
  async sendOTPSMS(
    phone: string, 
    otp: string, 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<SMSSendResult>> {
    try {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { 
        phone: this.maskPhoneNumber(phone), 
        purpose,
        method: 'SMS text message with our database OTP',
        otpLength: otp.length
      });

      // Send our database OTP via 2Factor SMS
      // This ensures the OTP received matches our database for verification
      logInfo('Sending database OTP via 2Factor SMS', { 
        phone: this.maskPhoneNumber(phone),
        otp: otp.substring(0, 2) + '****', // Show first 2 digits only
        purpose,
        delivery: 'SMS text message'
      });

      const message = this.formatOTPSMS(otp, purpose);
      const options: SMSOptions = {
        tag: `otp_${purpose}`,
        sender: config.TWOFACTOR_SMS_SENDER
      };

      const result = await this.sendSMS(phone, message, options);

      // Development fallback: If SMS fails in development, simulate success
      if (!result.success && config.NODE_ENV === 'development') {
        logInfo('🚧 Development Mode: SMS API failed, simulating successful delivery', {
          phone: this.maskPhoneNumber(phone),
          otp: otp.substring(0, 2) + '****',
          purpose,
          note: 'Check console for OTP - SMS delivery simulated'
        });

        // Log the OTP to console for development testing
        console.log(`\n🚧 DEVELOPMENT OTP: ${otp} for ${phone}`);
        console.log(`📱 Use this OTP to test phone login verification\n`);

        return {
          success: true,
          data: {
            messageId: 'dev-mock-' + Date.now(),
            status: 'sent',
            recipient: this.maskPhoneNumber(phone)
          }
        };
      }

      return result;

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'sendOTPSMS', { 
        error: error.message,
        phone: this.maskPhoneNumber(phone),
        purpose 
      }, false);

      // Development fallback: If SMS fails in development, simulate success
      if (config.NODE_ENV === 'development') {
        logInfo('🚧 Development Mode: SMS API failed, simulating successful delivery', {
          phone: this.maskPhoneNumber(phone),
          otp: otp.substring(0, 2) + '****',
          purpose,
          note: 'Check console for OTP - SMS delivery simulated'
        });

        // Log the OTP to console for development testing
        console.log(`\n🚧 DEVELOPMENT OTP: ${otp} for ${phone}`);
        console.log(`📱 Use this OTP to test phone login verification\n`);

        return {
          success: true,
          data: {
            messageId: 'dev-mock-' + Date.now(),
            status: 'sent',
            recipient: this.maskPhoneNumber(phone)
          }
        };
      }

      return {
        success: false,
        error: `Failed to send OTP via SMS: ${error.message}`
      };
    }
  }

  /**
   * Verify OTP using 2Factor API (optional - can be used for additional verification)
   */
  async verifyOTP(sessionId: string, otp: string): Promise<ServiceResponse<{ verified: boolean }>> {
    try {
      logServiceOperation(this.serviceName, 'verifyOTP', { sessionId });

      const url = `${this.apiBaseUrl}/${config.TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

      const result = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseData = result.data;
      const verified = responseData.Status === 'Success' && responseData.Details === 'OTP Matched';

      logServiceOperation(this.serviceName, 'verifyOTP', { 
        sessionId,
        verified,
        success: true 
      });

      return {
        success: true,
        data: { verified }
      };

    } catch (error: any) {
      logServiceOperation(this.serviceName, 'verifyOTP', { 
        error: error.message,
        sessionId
      }, false);

      return {
        success: false,
        error: `Failed to verify OTP: ${error.message}`
      };
    }
  }

  /**
   * Format OTP SMS message (simplified to avoid special characters)
   */
  private formatOTPSMS(otp: string, purpose: string): string {
    // Very simple message format to ensure SMS delivery success
    // Avoiding periods, special chars that can cause 2Factor API issues
    return `Your EdTech OTP ${otp} Valid 5min`;
  }

  /**
   * Clean and format phone number for 2Factor API
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // 2Factor expects phone numbers WITH country code prefix
    if (cleaned.startsWith('+91')) {
      // Already in correct format: +91XXXXXXXXXX
      return cleaned;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      // Add + to make it +91XXXXXXXXXX
      return '+' + cleaned;
    } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      // Indian number without country code: XXXXXXXXXX -> +91XXXXXXXXXX
      return '+91' + cleaned;
    }
    
    // If it doesn't match expected patterns, return as-is for error handling
    return cleaned;
  }

  /**
   * Validate phone number format for 2Factor API
   */
  private isValidPhoneNumber(phone: string): boolean {
    // 2Factor expects phone numbers in +91XXXXXXXXXX format
    const phoneRegex = /^\+91[6-9]\d{9}$/; // +91 followed by valid Indian mobile number
    return phoneRegex.test(phone);
  }

  /**
   * Mask phone number for logging (privacy)
   */
  private maskPhoneNumber(phone: string): string {
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
      return this.isInitialized;
    } catch (error) {
      logError('2Factor SMS service health check failed', error);
      return false;
    }
  }

  /**
   * Analyze possible causes of API errors
   */
  private analyzePossibleCauses(error: any): string[] {
    const causes: string[] = [];
    
    if (!error.response) {
      causes.push('Network connectivity issue or invalid base URL');
    } else {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          causes.push('Invalid request format or parameters');
          if (data?.Details?.includes('Invalid Mobile Number')) {
            causes.push('Phone number format is invalid for 2Factor API');
          }
          break;
        case 401:
          causes.push('Invalid or expired API key');
          break;
        case 403:
          causes.push('API key lacks permissions or account suspended');
          break;
        case 429:
          causes.push('Rate limit exceeded');
          break;
        case 500:
          causes.push('2Factor server error');
          break;
        default:
          causes.push(`HTTP ${status} error from 2Factor API`);
      }
      
      if (data?.Details) {
        causes.push(`API Details: ${data.Details}`);
      }
    }
    
    return causes;
  }
} 
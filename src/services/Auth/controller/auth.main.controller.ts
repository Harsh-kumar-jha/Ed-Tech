/**
 * Auth Main Controller
 * Coordinates all authentication operations using smaller controllers (Single Responsibility)
 */

import { Request, Response, NextFunction } from 'express';
import { RegistrationController } from './registration.controller';
import { AuthenticationController } from './authentication.controller';
import { PasswordController } from './password.controller';
import { OTPController } from './otp.controller';
import { AuthServiceImpl } from '../services/auth-service.implementation';
import { OTPService, TokenService } from '../services';
import { ResponseService, ErrorService } from '../../../common';
import { config } from '../../../config/environment';
import { logInfo } from '../../../utils/logger';

export class AuthMainController {
  private registrationController: RegistrationController;
  private authenticationController: AuthenticationController;
  private passwordController: PasswordController;
  private otpController: OTPController;
  private responseService = new ResponseService();

  constructor() {
    // Initialize shared services
    const authService = new AuthServiceImpl();
    const tokenService = new TokenService();
    const otpService = new OTPService();

    // Initialize controllers with dependency injection
    this.registrationController = new RegistrationController(authService);
    this.authenticationController = new AuthenticationController(authService, tokenService);
    this.passwordController = new PasswordController(authService, otpService);
    this.otpController = new OTPController();
  }

  // Registration endpoints
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.registrationController.register(req, res, next);
  }

  // Authentication endpoints
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.authenticationController.login(req, res, next);
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.authenticationController.logout(req, res, next);
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.authenticationController.refreshToken(req, res, next);
  }

  // OTP endpoints
  async phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.otpController.phoneLogin(req, res, next);
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.otpController.verifyOTP(req, res, next);
  }

  // Password endpoints
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.passwordController.forgotPassword(req, res, next);
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.passwordController.resetPassword(req, res, next);
  }

  // Email verification endpoints
  async sendEmailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      logInfo('Email verification request received', { email });

      if (!email) {
        res.status(400).json(this.responseService.error(
          'Email is required',
          'MISSING_EMAIL'
        ));
        return;
      }

      // Generate and send email verification OTP
      const result = await this.otpController.generateEmailVerificationOTP(email);
      
      if (!result.success) {
        res.status(500).json(this.responseService.error(
          result.error || 'Failed to send email verification',
          'EMAIL_VERIFICATION_FAILED'
        ));
        return;
      }

      res.status(200).json(this.responseService.success({
        otpSent: result.data?.sent || false,
        otpId: result.data?.otpId,
        expiresIn: 300
      }, 'Email verification OTP sent successfully'));
      
    } catch (error: any) {
      this.responseService.error('Email verification error: ' + error.message, 'EMAIL_VERIFICATION_ERROR');
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      
      logInfo('Email verification OTP received', { email });

      if (!email || !otp) {
        res.status(400).json(this.responseService.error(
          'Email and OTP are required',
          'MISSING_FIELDS'
        ));
        return;
      }

      // Verify email OTP
      const result = await this.otpController.verifyEmailOTP(email, otp);
      
      if (!result.success) {
        res.status(400).json(this.responseService.error(
          result.error || 'Invalid or expired OTP',
          'INVALID_OTP'
        ));
        return;
      }

      res.status(200).json(this.responseService.success({
        emailVerified: true,
        user: result.data?.user
      }, 'Email verified successfully. You can now use phone login.'));
      
    } catch (error: any) {
      res.status(500).json(this.responseService.error('Email verification error: ' + error.message, 'EMAIL_VERIFICATION_ERROR'));
    }
  }

  // Debug endpoint to check environment configuration
  async debugConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const debugInfo = {
        environment: config.NODE_ENV,
        brevoConfig: {
          hasApiKey: !!config.BREVO_API_KEY,
          apiKeyLength: config.BREVO_API_KEY?.length || 0,
          sender: config.BREVO_EMAIL_SENDER,
          senderName: config.BREVO_EMAIL_SENDER_NAME
        },
        twoFactorConfig: {
          hasApiKey: !!config.TWOFACTOR_API_KEY,
          apiKeyLength: config.TWOFACTOR_API_KEY?.length || 0,
          apiKeyPreview: config.TWOFACTOR_API_KEY ? `***${config.TWOFACTOR_API_KEY.slice(-4)}` : 'Not set',
          baseUrl: config.TWOFACTOR_BASE_URL,
          sender: config.TWOFACTOR_SMS_SENDER,
          isValidUrl: config.TWOFACTOR_BASE_URL?.startsWith('http'),
          // Sample URL format (with masked API key)
          sampleUrl: config.TWOFACTOR_API_KEY && config.TWOFACTOR_BASE_URL ? 
            `${config.TWOFACTOR_BASE_URL}/***${config.TWOFACTOR_API_KEY.slice(-4)}/SMS/919876543210/123456/${config.TWOFACTOR_SMS_SENDER}` : 
            'Cannot generate - missing config'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(this.responseService.success(debugInfo, 'Environment configuration'));
    } catch (error: any) {
      res.status(500).json(this.responseService.error('Failed to get debug info', 'DEBUG_ERROR'));
    }
  }

  // Test 2Factor API connectivity (development only)
  async test2FactorAPI(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'development') {
        res.status(403).json(this.responseService.error('This endpoint is only available in development mode', 'DEV_ONLY'));
        return;
      }

      // Basic configuration check
      if (!config.TWOFACTOR_API_KEY) {
        res.status(400).json(this.responseService.error('TWOFACTOR_API_KEY is not configured', 'MISSING_API_KEY'));
        return;
      }

      if (!config.TWOFACTOR_BASE_URL) {
        res.status(400).json(this.responseService.error('TWOFACTOR_BASE_URL is not configured', 'MISSING_BASE_URL'));
        return;
      }

      // Try a simple API test call (without actually sending OTP)
      const testUrl = `${config.TWOFACTOR_BASE_URL}/${config.TWOFACTOR_API_KEY}/SMS/919999999999/TEST/EdTech`;
      
      logInfo('Testing 2Factor API connectivity', {
        url: testUrl.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY.slice(-4)}`),
        note: 'This is a test call to verify API connectivity'
      });

      try {
        const axios = require('axios');
        const response = await axios.get(testUrl, { timeout: 10000 });
        
        res.status(200).json(this.responseService.success({
          apiConnectivity: 'SUCCESS',
          responseStatus: response.status,
          responseData: response.data,
          message: 'API is accessible (test call successful)'
        }, '2Factor API connectivity test'));

      } catch (apiError: any) {
        // API error details
        const errorDetails = {
          apiConnectivity: 'FAILED',
          errorType: apiError.name,
          errorMessage: apiError.message,
          httpStatus: apiError.response?.status,
          httpStatusText: apiError.response?.statusText,
          responseData: apiError.response?.data,
          isNetworkError: !apiError.response,
          possibleCauses: []
        };

        // Analyze possible causes
        if (!apiError.response) {
          errorDetails.possibleCauses.push('Network connectivity issue or invalid base URL');
        } else if (apiError.response?.status === 401) {
          errorDetails.possibleCauses.push('Invalid API key');
        } else if (apiError.response?.status === 403) {
          errorDetails.possibleCauses.push('API key lacks permissions or account suspended');
        } else if (apiError.response?.status === 400) {
          errorDetails.possibleCauses.push('Invalid request format or parameters');
        }

        res.status(500).json(this.responseService.error(
          `2Factor API test failed: ${errorDetails.errorMessage}. Possible causes: ${errorDetails.possibleCauses.join(', ')}`,
          'API_TEST_FAILED'
        ));
      }

    } catch (error: any) {
      res.status(500).json(this.responseService.error('2Factor API test error: ' + error.message, 'TEST_ERROR'));
    }
  }

  // Test phone number formatting (development only)
  async testPhoneFormatting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'development') {
        res.status(403).json(this.responseService.error('This endpoint is only available in development mode', 'DEV_ONLY'));
        return;
      }

      const { phone } = req.body;
      
      if (!phone) {
        res.status(400).json(this.responseService.error('Phone number is required', 'MISSING_PHONE'));
        return;
      }

      // Replicate phone number processing logic for testing
      const cleanPhoneNumber = (phone: string): string => {
        let cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+91')) {
          return cleaned;
        } else if (cleaned.startsWith('91') && cleaned.length === 12) {
          return '+' + cleaned;
        } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
          return '+91' + cleaned;
        }
        return cleaned;
      };

      const isValidPhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^\+91[6-9]\d{9}$/;
        return phoneRegex.test(phone);
      };

      const cleanPhone = cleanPhoneNumber(phone);
      const isValid = isValidPhoneNumber(cleanPhone);
      const phoneForUrl = cleanPhone.replace('+', '');

      // Generate test URL format
      const testMessage = 'Test message for EdTech OTP verification';
      const encodedMessage = encodeURIComponent(testMessage);
      const encodedSender = encodeURIComponent(config.TWOFACTOR_SMS_SENDER);
      const testUrl = `${config.TWOFACTOR_BASE_URL}/${config.TWOFACTOR_API_KEY}/SMS/${phoneForUrl}/${encodedMessage}/${encodedSender}`;

      res.status(200).json(this.responseService.success({
        input: {
          originalPhone: phone,
          phoneLength: phone.length
        },
        processing: {
          cleanedPhone: cleanPhone,
          isValid: isValid,
          phoneForUrl: phoneForUrl,
          urlPhoneLength: phoneForUrl.length
        },
        api: {
          baseUrl: config.TWOFACTOR_BASE_URL,
          sender: config.TWOFACTOR_SMS_SENDER,
          hasApiKey: !!config.TWOFACTOR_API_KEY,
          apiKeyLength: config.TWOFACTOR_API_KEY?.length,
          testUrlFormat: testUrl.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY.slice(-4)}`),
          messageLength: testMessage.length,
          encodedMessageLength: encodedMessage.length
        },
        validation: {
          expectedFormat: '+91XXXXXXXXXX',
          actualFormat: cleanPhone,
          passes: isValid,
          phoneRegex: '^\\+91[6-9]\\d{9}$'
        }
      }, 'Phone number formatting test'));

    } catch (error: any) {
      res.status(500).json(this.responseService.error('Phone formatting test error: ' + error.message, 'FORMAT_TEST_ERROR'));
    }
  }

  // POST /auth/debug-sms-send - Debug actual SMS sending with detailed error info
  async debugSMSSending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'development') {
        res.status(403).json(this.responseService.error('This endpoint is only available in development mode', 'DEV_ONLY'));
        return;
      }

      const { phone, message } = req.body;
      
      if (!phone) {
        res.status(400).json(this.responseService.error('Phone number is required', 'MISSING_PHONE'));
        return;
      }

      const testMessage = message || 'Test SMS from EdTech OTP 123456 Valid 5min';

      // Import axios for direct API testing
      const axios = require('axios');

      // Replicate TwoFactorSMSService logic
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const phoneForUrl = cleanPhone.replace('+', '');
      const encodedMessage = encodeURIComponent(testMessage);
      const encodedSender = encodeURIComponent(config.TWOFACTOR_SMS_SENDER);
      const url = `${config.TWOFACTOR_BASE_URL}/${config.TWOFACTOR_API_KEY}/SMS/${phoneForUrl}/${encodedMessage}/${encodedSender}`;

      console.log('\n🔍 DEBUG SMS SENDING:');
      console.log('📱 Phone:', phone, '→', cleanPhone, '→', phoneForUrl);
      console.log('💬 Message:', testMessage);
      console.log('🔗 URL:', url.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY?.slice(-4)}`));
      console.log('🔑 API Key Length:', config.TWOFACTOR_API_KEY?.length);
      console.log('📤 Making API call...\n');

      try {
        const result = await axios.get(url, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ SMS API SUCCESS:');
        console.log('Status:', result.status);
        console.log('Response:', result.data);

        res.status(200).json(this.responseService.success({
          apiCall: {
            success: true,
            httpStatus: result.status,
            response: result.data,
            url: url.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY?.slice(-4)}`),
            phone: phoneForUrl,
            message: testMessage,
            sender: config.TWOFACTOR_SMS_SENDER
          }
        }, 'SMS API call successful'));

      } catch (apiError: any) {
        console.log('❌ SMS API ERROR:');
        console.log('Error Type:', apiError.name);
        console.log('Error Message:', apiError.message);
        console.log('HTTP Status:', apiError.response?.status);
        console.log('HTTP Status Text:', apiError.response?.statusText);
        console.log('Response Data:', apiError.response?.data);
        console.log('Response Headers:', apiError.response?.headers);
        console.log('Request URL:', apiError.config?.url);
        console.log('Full Error:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2));

        res.status(200).json(this.responseService.success({
          apiCall: {
            success: false,
            error: {
              name: apiError.name,
              message: apiError.message,
              code: apiError.code,
              httpStatus: apiError.response?.status,
              httpStatusText: apiError.response?.statusText,
              responseData: apiError.response?.data,
              responseHeaders: apiError.response?.headers,
              fullError: JSON.stringify(apiError, Object.getOwnPropertyNames(apiError))
            },
            url: url.replace(config.TWOFACTOR_API_KEY, `***${config.TWOFACTOR_API_KEY?.slice(-4)}`),
            phone: phoneForUrl,
            message: testMessage,
            sender: config.TWOFACTOR_SMS_SENDER,
            troubleshooting: {
              possibleCauses: [
                apiError.response?.status === 401 ? 'Invalid API key' : null,
                apiError.response?.status === 403 ? 'API key lacks permissions or account suspended' : null,
                apiError.response?.status === 400 ? 'Invalid request format or phone number' : null,
                apiError.response?.status === 429 ? 'Rate limit exceeded' : null,
                !apiError.response ? 'Network connectivity issue' : null,
                apiError.response?.data?.Details ? `API Details: ${apiError.response.data.Details}` : null
              ].filter(Boolean),
              nextSteps: [
                'Check your 2Factor.in account dashboard',
                'Verify API key is correct and active',
                'Check account balance/credits',
                'Ensure phone number format is correct',
                'Contact 2Factor support if needed'
              ]
            }
          }
        }, 'SMS API debugging completed'));
      }

    } catch (error: any) {
      console.log('💥 DEBUG ENDPOINT ERROR:', error.message);
      res.status(500).json(this.responseService.error('Debug SMS error: ' + error.message, 'DEBUG_SMS_ERROR'));
    }
  }
} 
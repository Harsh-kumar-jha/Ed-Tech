/**
 * Auth Routes
 * Authentication and authorization routes
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { AuthMainController } from '../controller/auth.main.controller';
import {
  validateRegister,
  validateLogin,
  validatePhoneLogin,
  validateVerifyOTP,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateLogout,
  validateSendEmailVerification,
  validateVerifyEmail,
} from '../middleware/auth.middleware';
import * as oauthController from '../controller/oauth.controller';

const router: RouterType = Router();
const authController = new AuthMainController();

// POST /auth/register - Register new user
router.post('/register', validateRegister, authController.register.bind(authController));

// POST /auth/login - Login with email/username and password
router.post('/login', validateLogin, authController.login.bind(authController));

// POST /auth/phone-login - Initiate phone login (send OTP)
router.post('/phone-login', validatePhoneLogin, authController.phoneLogin.bind(authController));

// POST /auth/verify-otp - Verify OTP for login or password reset
router.post('/verify-otp', validateVerifyOTP, authController.verifyOTP.bind(authController));

// POST /auth/forgot-password - Initiate forgot password process
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword.bind(authController));

// POST /auth/reset-password - Reset password with OTP
router.post('/reset-password', validateResetPassword, authController.resetPassword.bind(authController));

// POST /auth/refresh-token - Refresh access token
router.post('/refresh-token', validateRefreshToken, authController.refreshToken.bind(authController));

// POST /auth/logout - Logout (invalidate session)
router.post('/logout', validateLogout, authController.logout.bind(authController));

// POST /auth/send-email-verification - Send email verification OTP
router.post('/send-email-verification', validateSendEmailVerification, authController.sendEmailVerification.bind(authController));

// POST /auth/verify-email - Verify email address with OTP
router.post('/verify-email', validateVerifyEmail, authController.verifyEmail.bind(authController));

// Google OAuth
router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);

// Microsoft OAuth
router.get('/microsoft', oauthController.microsoftAuth);
router.post('/microsoft/callback', oauthController.microsoftCallback);

// Development only endpoints
if (process.env.NODE_ENV === 'development') {
  // GET /auth/debug-config - Debug environment configuration
  router.get('/debug-config', authController.debugConfig.bind(authController));
  
  // GET /auth/test-2factor-api - Test 2Factor API connectivity
  router.get('/test-2factor-api', authController.test2FactorAPI.bind(authController));
  
  // POST /auth/test-phone-formatting - Test phone number formatting
  router.post('/test-phone-formatting', authController.testPhoneFormatting.bind(authController));
  
  // POST /auth/debug-sms-send - Debug actual SMS sending with detailed error info
  router.post('/debug-sms-send', authController.debugSMSSending.bind(authController));
}

export default router; 
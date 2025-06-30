/**
 * Auth Routes
 * Authentication and authorization routes
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { AuthController } from '../controller/auth.controller';
import {
  validateRegister,
  validateLogin,
  validatePhoneLogin,
  validateVerifyOTP,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateLogout,
} from '../middleware/auth.middleware';

const router: RouterType = Router();
const authController = new AuthController();

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

export default router; 
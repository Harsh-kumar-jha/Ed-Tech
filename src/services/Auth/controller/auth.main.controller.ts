/**
 * Main Auth Controller
 * Coordinates smaller controllers using dependency injection
 * Implements SOLID principles
 */

import { Request, Response, NextFunction } from 'express';
import { RegistrationController } from './registration.controller';
import { AuthenticationController } from './authentication.controller';
import { PasswordController } from './password.controller';
import { OTPController } from './otp.controller';
import { AuthServiceImpl } from '../services/auth-service.implementation';
import { TokenService } from '../services/token.service';
import { OTPService } from '../services/otp.service';

export class AuthMainController {
  private registrationController: RegistrationController;
  private authenticationController: AuthenticationController;
  private passwordController: PasswordController;
  private otpController: OTPController;

  constructor() {
    // Initialize services (Dependency Injection)
    const authService = new AuthServiceImpl();
    const tokenService = new TokenService();
    const otpService = new OTPService();

    // Initialize controllers with injected services
    this.registrationController = new RegistrationController(authService);
    this.authenticationController = new AuthenticationController(authService, tokenService);
    this.passwordController = new PasswordController(authService, otpService);
    this.otpController = new OTPController(otpService, tokenService);
  }

  // Registration endpoints
  register = (req: Request, res: Response, next: NextFunction) => {
    return this.registrationController.register(req, res, next);
  };

  // Authentication endpoints
  login = (req: Request, res: Response, next: NextFunction) => {
    return this.authenticationController.login(req, res, next);
  };

  refreshToken = (req: Request, res: Response, next: NextFunction) => {
    return this.authenticationController.refreshToken(req, res, next);
  };

  logout = (req: Request, res: Response, next: NextFunction) => {
    return this.authenticationController.logout(req, res, next);
  };

  // Password endpoints
  forgotPassword = (req: Request, res: Response, next: NextFunction) => {
    return this.passwordController.forgotPassword(req, res, next);
  };

  resetPassword = (req: Request, res: Response, next: NextFunction) => {
    return this.passwordController.resetPassword(req, res, next);
  };

  // OTP endpoints
  phoneLogin = (req: Request, res: Response, next: NextFunction) => {
    return this.otpController.phoneLogin(req, res, next);
  };

  verifyOTP = (req: Request, res: Response, next: NextFunction) => {
    return this.otpController.verifyOTP(req, res, next);
  };
} 
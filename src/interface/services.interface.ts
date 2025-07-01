/**
 * Service interfaces for Dependency Inversion Principle
 * All service implementations should implement these interfaces
 */

import { 
  CreateUserRequest, 
  LoginRequest, 
  User, 
  UserWithoutPassword 
} from './index';
import { ServiceResponse } from './base.interface';

// Base service interface
export interface IBaseService {
  readonly serviceName: string;
}

// Auth service interface
export interface IAuthService extends IBaseService {
  createUser(userData: CreateUserRequest): Promise<ServiceResponse<UserWithoutPassword>>;
  authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<UserWithoutPassword>>;
  getUserById(userId: string): Promise<ServiceResponse<UserWithoutPassword | null>>;
  getUserByEmail(email: string): Promise<ServiceResponse<UserWithoutPassword | null>>;
  updatePassword(userId: string, newPassword: string): Promise<ServiceResponse<boolean>>;
  verifyEmail(userId: string): Promise<ServiceResponse<boolean>>;
  deactivateUser(userId: string): Promise<ServiceResponse<boolean>>;
}

// Token service interface  
export interface ITokenService extends IBaseService {
  generateTokens(user: User): any;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): { userId: string };
  extractTokenFromHeader(authorization?: string): string | null;
  blacklistToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

// OTP service interface
export interface IOTPService extends IBaseService {
  generateOTP(identifier: string, identifierType: 'email' | 'phone', purpose: string): Promise<ServiceResponse<{ otpId: string; sent?: boolean; messageId?: string }>>;
  verifyOTP(identifier: string, identifierType: 'email' | 'phone', otp: string, purpose: string): Promise<ServiceResponse<{ user?: any; verified: boolean }>>;
}

// Password service interface
export interface IPasswordService extends IBaseService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

// Response service interface for standardized responses
export interface IResponseService extends IBaseService {
  success<T>(data?: T, message?: string): any;
  error(message: string, code?: string, statusCode?: number): any;
  paginated<T>(data: T[], meta: any): any;
}

// Error handling service interface
export interface IErrorService extends IBaseService {
  handleError(error: any, res?: any, context?: any): void;
  createError(message: string, code?: string, statusCode?: number): Error;
}

// Communication service interface
// Export ServiceResponse for other modules
export { ServiceResponse } from './base.interface';

export interface ICommunicationService extends IBaseService {
  sendSMS(to: string, message: string, options?: SMSOptions): Promise<ServiceResponse<SMSSendResult>>;
  sendEmail(to: string, subject: string, content: EmailContent, options?: EmailOptions): Promise<ServiceResponse<EmailSendResult>>;
  sendOTPSMS(phone: string, otp: string, purpose: 'login' | 'password_reset' | 'email_verification'): Promise<ServiceResponse<SMSSendResult>>;
  sendOTPEmail(email: string, otp: string, purpose: 'login' | 'password_reset' | 'email_verification'): Promise<ServiceResponse<EmailSendResult>>;
}

export interface SMSOptions {
  sender?: string;
  scheduledAt?: Date;
  tag?: string;
}

export interface EmailOptions {
  sender?: {
    email: string;
    name?: string;
  };
  replyTo?: string;
  tags?: string[];
  scheduledAt?: Date;
  templateId?: number;
  params?: Record<string, any>;
}

export interface EmailContent {
  type: 'text' | 'html' | 'template';
  content: string;
  textContent?: string; // for HTML emails, provide plain text fallback
}

export interface SMSSendResult {
  messageId: string;
  status: 'sent' | 'failed' | 'scheduled';
  creditsUsed?: number;
  recipient: string;
}

export interface EmailSendResult {
  messageId: string;
  status: 'sent' | 'failed' | 'scheduled';
  recipient: string;
}

export interface IUserVerificationService extends IBaseService {
  checkPhoneVerificationStatus(phone: string): Promise<ServiceResponse<UserVerificationStatus>>;
  isPhoneNumberRegistered(phone: string): Promise<ServiceResponse<boolean>>;
  getUserByPhone(phone: string): Promise<ServiceResponse<UserBasicInfo | null>>;
}

export interface UserVerificationStatus {
  isRegistered: boolean;
  isVerified: boolean;
  canLogin: boolean;
  user?: UserBasicInfo;
  message: string;
  actionRequired: 'login' | 'register' | 'verify_email' | 'account_inactive';
}

export interface UserBasicInfo {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role: string;
} 
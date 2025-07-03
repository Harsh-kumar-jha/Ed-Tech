/**
 * Central export file for all interfaces
 * Import all interfaces from their domain-specific files
 */

// Base interfaces
export * from './base.interface';

// User domain interfaces  
export * from './user.interface';

// Authentication domain interfaces (excluding JWTPayload to avoid duplication)
export { 
  CreateUserRequest,
  LoginRequest,
  PhoneLoginRequest,
  VerifyOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OTPRecord,
  AuthTokens
} from './auth.interface';

// IELTS domain interfaces
export * from './ielts.interface';

// AI domain interfaces
export * from './ai.interface';

// System domain interfaces
export * from './system.interface';

// Service interfaces
export * from './services.interface';

// JWT Payload interface (legacy export for backwards compatibility)
export { JWTPayload } from './JWTPayload';

 
/**
 * Authentication domain interfaces
 */

export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  role?: 'student' | 'instructor';
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface PhoneLoginRequest {
  phone: string;
}

export interface VerifyOTPRequest {
  phone?: string;
  email?: string;
  otp: string;
  type: 'login' | 'password_reset';
}

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  token?: string;
  otp?: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface OTPRecord {
  id: string;
  identifier: string; // email or phone
  identifierType: 'email' | 'phone';
  otp: string;
  purpose: 'login' | 'password_reset' | 'email_verification';
  userId?: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// JWT token payload interface (already exists, keeping for consistency)
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
} 
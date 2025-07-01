import { Request, Response, NextFunction } from 'express';

// Basic validation functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const isValidOTP = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

// Register validation middleware
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { email, username, firstName, lastName, password, phone, role } = req.body;
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (!firstName || firstName.length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!lastName || lastName.length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  if (!password || !isStrongPassword(password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (role && !['student', 'instructor'].includes(role)) {
    errors.push('Role must be either student or instructor');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Login validation middleware
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, username, password } = req.body;
  const errors: string[] = [];

  if (!email && !username) {
    errors.push('Either email or username is required');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Phone login validation middleware
export const validatePhoneLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body;
  const errors: string[] = [];

  if (!phone || !isValidPhone(phone)) {
    errors.push('Valid phone number is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// OTP verification validation middleware
export const validateVerifyOTP = (req: Request, res: Response, next: NextFunction): void => {
  const { phone, email, otp, type } = req.body;
  const errors: string[] = [];

  if (!phone && !email) {
    errors.push('Either phone or email is required');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!otp || !isValidOTP(otp)) {
    errors.push('Valid 6-digit OTP is required');
  }

  if (!type || !['login', 'password_reset'].includes(type)) {
    errors.push('Type must be either login or password_reset');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Forgot password validation middleware
export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email, phone } = req.body;
  const errors: string[] = [];

  if (!email && !phone) {
    errors.push('Either email or phone is required');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Reset password validation middleware
export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email, phone, otp, password, confirmPassword } = req.body;
  const errors: string[] = [];

  if (!email && !phone) {
    errors.push('Either email or phone is required');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (!otp || !isValidOTP(otp)) {
    errors.push('Valid 6-digit OTP is required');
  }

  if (!password || !isStrongPassword(password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  if (confirmPassword && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Refresh token validation middleware
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Refresh token is required',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  next();
};

// Logout validation middleware
export const validateLogout = (req: Request, res: Response, next: NextFunction): void => {
  // Handle case where req.body might be undefined
  const body = req.body || {};
  const { refreshToken } = body;
  
  // Check for refresh token in body OR access token in headers
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  if (!refreshToken && !accessToken) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Either refresh token in body or access token in Authorization header is required for logout',
        code: 'VALIDATION_ERROR',
        details: [
          'Option 1: Send refreshToken in request body',
          'Option 2: Send access token in Authorization header as "Bearer <token>"'
        ]
      },
    });
    return;
  }

  next();
};

// Send email verification validation middleware
export const validateSendEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
};

// Verify email validation middleware
export const validateVerifyEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email, otp } = req.body;
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!otp || !isValidOTP(otp)) {
    errors.push('Valid 6-digit OTP is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  next();
}; 
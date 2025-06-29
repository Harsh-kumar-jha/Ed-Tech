// API Response Messages
export const MESSAGES = {
  SUCCESS: {
    GENERAL: 'Operation completed successfully',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTRATION: 'Registration successful',
    PASSWORD_RESET: 'Password reset successful',
    EMAIL_VERIFIED: 'Email verified successfully',
  },
  ERROR: {
    GENERAL: 'An error occurred',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    BAD_REQUEST: 'Bad request',
    DUPLICATE_ENTRY: 'Resource already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',
    EMAIL_NOT_VERIFIED: 'Email not verified',
    ACCOUNT_DISABLED: 'Account is disabled',
  },
} as const; 
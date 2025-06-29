// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
} as const; 
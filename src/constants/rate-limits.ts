// Rate Limiting Configuration
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // 5 attempts per window
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // 100 requests per window
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10, // 10 uploads per hour
  },
} as const; 
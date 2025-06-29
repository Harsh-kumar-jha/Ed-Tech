// Default values for various application features
export const DEFAULTS = {
  // Pagination
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // IELTS Test
  READING_DURATION: 3600, // 60 minutes in seconds
  LISTENING_DURATION: 1800, // 30 minutes in seconds
  WRITING_DURATION: 3600, // 60 minutes in seconds
  SPEAKING_DURATION: 840, // 14 minutes in seconds
  
  // Scoring
  MIN_SCORE: 0,
  MAX_SCORE: 9,
  PASS_SCORE: 6.5,
  
  // File uploads
  MAX_FILE_SIZE: 10485760, // 10MB
  
  // Cache TTL (in seconds)
  CACHE_TTL: 3600, // 1 hour
  SHORT_CACHE_TTL: 300, // 5 minutes
  LONG_CACHE_TTL: 86400, // 24 hours
  
  // Search
  MIN_SEARCH_LENGTH: 3,
  MAX_SEARCH_LENGTH: 100,
  
  // User preferences
  TIMEZONE: 'UTC',
  LANGUAGE: 'en',
  THEME: 'light',
  
  // Notifications
  NOTIFICATION_RETENTION_DAYS: 30,
} as const; 
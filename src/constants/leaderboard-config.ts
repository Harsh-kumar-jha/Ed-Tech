// Leaderboard configuration and settings
export const LEADERBOARD_CONFIG = {
  // Ranking periods
  PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'all_time',
  },
  
  // Leaderboard types
  TYPES: {
    OVERALL: 'overall',
    READING: 'reading',
    LISTENING: 'listening',
    WRITING: 'writing',
    SPEAKING: 'speaking',
  },
  
  // Display settings
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  REFRESH_INTERVAL: 300, // 5 minutes in seconds
  
  // Point calculations
  POINTS: {
    TEST_COMPLETION: 100,
    PERFECT_SCORE: 500,
    DAILY_STREAK: 50,
    WEEKLY_STREAK: 200,
    FIRST_ATTEMPT: 25,
    IMPROVEMENT: 150,
  },
  
  // Achievement thresholds
  ACHIEVEMENTS: {
    BRONZE: 1000,
    SILVER: 5000,
    GOLD: 15000,
    PLATINUM: 50000,
    DIAMOND: 100000,
  },
  
  // Badge categories
  BADGES: {
    COMPLETION: 'completion',
    ACCURACY: 'accuracy',
    CONSISTENCY: 'consistency',
    IMPROVEMENT: 'improvement',
    SPECIAL: 'special',
  },
} as const; 
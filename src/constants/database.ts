// Database Table Names
export const TABLES = {
  USERS: 'users',
  PROFILES: 'profiles',
  TESTS: 'tests',
  TEST_RESULTS: 'test_results',
  QUESTIONS: 'questions',
  ANSWERS: 'answers',
  LEADERBOARD: 'leaderboard',
  SESSIONS: 'sessions',
  AUDIT_LOGS: 'audit_logs',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PREFIX: 'user:',
  TEST_PREFIX: 'test:',
  LEADERBOARD: 'leaderboard:global',
  SESSION_PREFIX: 'session:',
  RATE_LIMIT_PREFIX: 'rate_limit:',
} as const; 
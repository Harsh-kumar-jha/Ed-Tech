// Test status definitions
export const TEST_STATUS = {
  // Test states
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  
  // Test attempt states
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  
  // Question states
  UNANSWERED: 'unanswered',
  ANSWERED: 'answered',
  FLAGGED: 'flagged',
  REVIEWED: 'reviewed',
  
  // Grading states
  PENDING: 'pending',
  AUTO_GRADED: 'auto_graded',
  MANUALLY_GRADED: 'manually_graded',
  NEEDS_REVIEW: 'needs_review',
  
  // Test types
  PRACTICE: 'practice',
  MOCK: 'mock',
  OFFICIAL: 'official',
} as const; 
export const LISTENING_CONFIG = {
  // Test Configuration
  TOTAL_DURATION: 1800, // 30 minutes in seconds
  AUDIO_DURATION: 1500, // 25 minutes in seconds  
  REVIEW_DURATION: 300, // 5 minutes in seconds
  TOTAL_QUESTIONS: 40,
  
  // Test Sections
  SECTIONS: {
    SECTION_1: {
      questions: 10,
      type: 'SOCIAL_SURVIVAL',
      description: 'Conversation between two people in everyday social context'
    },
    SECTION_2: {
      questions: 10,
      type: 'SOCIAL_SURVIVAL',
      description: 'Monologue in everyday social context'
    },
    SECTION_3: {
      questions: 10,
      type: 'EDUCATIONAL_TRAINING',
      description: 'Conversation between multiple people in educational/training context'
    },
    SECTION_4: {
      questions: 10,
      type: 'EDUCATIONAL_TRAINING',
      description: 'Monologue on academic subject'
    }
  },
  
  // Question Types Distribution
  QUESTION_TYPES: {
    MULTIPLE_CHOICE: 'Multiple Choice',
    FORM_COMPLETION: 'Form Completion',
    NOTE_COMPLETION: 'Note Completion', 
    TABLE_COMPLETION: 'Table Completion',
    FLOW_CHART_COMPLETION: 'Flow Chart Completion',
    SUMMARY_COMPLETION: 'Summary Completion',
    SENTENCE_COMPLETION: 'Sentence Completion',
    SHORT_ANSWER: 'Short Answer Questions',
    CLASSIFICATION: 'Classification',
    MATCHING: 'Matching'
  },

  // Audio Configuration
  AUDIO: {
    ALLOWED_FORMATS: ['mp3', 'wav', 'm4a', 'aac'],
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    QUALITY: {
      BITRATE: '128k',
      SAMPLE_RATE: '44100',
      CHANNELS: 'stereo'
    },
    PLAYBACK: {
      CONTROLS_DISABLED: true,
      DOWNLOAD_DISABLED: true,
      SEEK_DISABLED: true,
      SPEED_CHANGE_DISABLED: true
    }
  },

  // Band Score Calculation
  BAND_SCORES: {
    39: 9.0, 37: 8.5, 35: 8.0, 32: 7.5, 30: 7.0,
    26: 6.5, 23: 6.0, 18: 5.5, 16: 5.0, 13: 4.5,
    10: 4.0, 8: 3.5, 6: 3.0, 4: 2.5, 3: 2.0, 2: 1.5, 1: 1.0, 0: 0
  },

  // Test Limits by Subscription
  TEST_LIMITS: {
    FREE: 5,
    PREMIUM: -1, // Unlimited
    ENTERPRISE: -1 // Unlimited
  },

  // Session Configuration
  SESSION: {
    CLEANUP_INTERVAL: 3600, // 1 hour in seconds
    WARNING_TIME: 300, // 5 minutes warning before auto-submit
    AUTO_SUBMIT_BUFFER: 60 // Auto-submit 1 minute before expiry
  },

  // Security Settings
  SECURITY: {
    DISABLE_CONTEXT_MENU: true,
    DISABLE_DEVELOPER_TOOLS: true,
    DISABLE_TEXT_SELECTION: true,
    DISABLE_COPY_PASTE: true,
    PREVENT_TAB_SWITCH: true,
    FULL_SCREEN_REQUIRED: false // Optional for better UX
  }
};

export const LISTENING_MESSAGES = {
  TEST_STARTED: 'Listening test started successfully',
  TEST_COMPLETED: 'Listening test completed successfully',
  TEST_SUBMITTED: 'Answers submitted successfully',
  AUDIO_LOADING: 'Loading audio file...',
  AUDIO_READY: 'Audio is ready to play',
  AUDIO_ERROR: 'Failed to load audio file',
  SESSION_EXPIRED: 'Test session has expired',
  CONCURRENT_SESSION: 'You have an active test session in another module',
  TEST_LIMIT_REACHED: 'Test limit reached for your subscription tier',
  INVALID_ANSWER_FORMAT: 'Invalid answer format provided',
  AUTO_SUBMIT_WARNING: 'Test will be auto-submitted in {minutes} minutes'
};

export const LISTENING_ERRORS = {
  AUDIO_NOT_FOUND: 'Audio file not found',
  INVALID_TEST_ID: 'Invalid listening test ID',
  SESSION_NOT_ACTIVE: 'No active listening test session found',
  ANSWERS_ALREADY_SUBMITTED: 'Answers have already been submitted',
  TEST_NOT_STARTED: 'Test has not been started yet',
  AUDIO_UPLOAD_FAILED: 'Failed to upload audio file',
  EVALUATION_FAILED: 'Answer evaluation failed',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action'
}; 
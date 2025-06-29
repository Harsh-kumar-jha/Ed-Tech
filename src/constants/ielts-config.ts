// IELTS test configuration and settings
export const IELTS_CONFIG = {
  // Test modules
  MODULES: {
    READING: 'reading',
    LISTENING: 'listening',
    WRITING: 'writing',
    SPEAKING: 'speaking',
  },
  
  // Test durations (in seconds)
  DURATIONS: {
    READING: 3600, // 60 minutes
    LISTENING: 1800, // 30 minutes
    WRITING: 3600, // 60 minutes
    SPEAKING: 840, // 14 minutes
  },
  
  // Question types
  QUESTION_TYPES: {
    // Reading question types
    MULTIPLE_CHOICE: 'multiple_choice',
    TRUE_FALSE_NOT_GIVEN: 'true_false_not_given',
    YES_NO_NOT_GIVEN: 'yes_no_not_given',
    MATCHING_HEADINGS: 'matching_headings',
    MATCHING_FEATURES: 'matching_features',
    MATCHING_SENTENCE_ENDINGS: 'matching_sentence_endings',
    SENTENCE_COMPLETION: 'sentence_completion',
    SUMMARY_COMPLETION: 'summary_completion',
    NOTE_COMPLETION: 'note_completion',
    TABLE_COMPLETION: 'table_completion',
    FLOW_CHART_COMPLETION: 'flow_chart_completion',
    DIAGRAM_LABELLING: 'diagram_labelling',
    SHORT_ANSWER: 'short_answer',
    
    // Listening question types
    FORM_COMPLETION: 'form_completion',
    MAP_PLAN_LABELLING: 'map_plan_labelling',
    
    // Writing tasks
    TASK_1_ACADEMIC: 'task_1_academic',
    TASK_1_GENERAL: 'task_1_general',
    TASK_2: 'task_2',
    
    // Speaking parts
    PART_1: 'part_1',
    PART_2: 'part_2',
    PART_3: 'part_3',
  },
  
  // Scoring bands
  BANDS: {
    MIN: 0,
    MAX: 9,
    INCREMENT: 0.5,
    PASS_THRESHOLD: 6.5,
  },
  
  // Writing task requirements
  WRITING: {
    TASK_1_MIN_WORDS: 150,
    TASK_2_MIN_WORDS: 250,
    TASK_1_RECOMMENDED_TIME: 20, // minutes
    TASK_2_RECOMMENDED_TIME: 40, // minutes
  },
  
  // Speaking test structure
  SPEAKING: {
    PART_1_DURATION: 240, // 4 minutes
    PART_2_DURATION: 240, // 4 minutes (including 1 minute preparation)
    PART_3_DURATION: 300, // 5 minutes
    PREPARATION_TIME: 60, // 1 minute for Part 2
  },
  
  // Test formats
  FORMATS: {
    ACADEMIC: 'academic',
    GENERAL_TRAINING: 'general_training',
  },
  
  // Difficulty levels
  DIFFICULTY: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },
  
  // Test sections per module
  SECTIONS: {
    READING: 3,
    LISTENING: 4,
    WRITING: 2,
    SPEAKING: 3,
  },
  
  // Maximum questions per section
  MAX_QUESTIONS: {
    READING: 40,
    LISTENING: 40,
    WRITING: 2,
    SPEAKING: 20,
  },
} as const; 
// AI configuration constants and settings
export const AI_CONFIG = {
  // Model configurations
  MODELS: {
    LLAMA2: 'llama2',
    LLAMA2_CHAT: 'llama2:chat',
    CODELLAMA: 'codellama',
    MISTRAL: 'mistral',
    DOLPHIN_MISTRAL: 'dolphin-mistral',
  },
  
  // AI service types
  SERVICES: {
    ESSAY_SCORING: 'essay_scoring',
    GRAMMAR_CHECK: 'grammar_check',
    FEEDBACK_GENERATION: 'feedback_generation',
    PRONUNCIATION_ANALYSIS: 'pronunciation_analysis',
    VOCABULARY_SUGGESTIONS: 'vocabulary_suggestions',
  },
  
  // Request settings
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
  TOP_P: 0.9,
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  
  // Scoring thresholds
  SCORING: {
    MIN_CONFIDENCE: 0.7,
    MAX_WORDS_PER_REQUEST: 1000,
    BATCH_SIZE: 10,
  },
  
  // Prompt templates
  PROMPTS: {
    ESSAY_SCORING: 'Score this IELTS essay on a scale of 1-9 considering task achievement, coherence and cohesion, lexical resource, and grammatical range and accuracy.',
    GRAMMAR_CHECK: 'Check the following text for grammatical errors and provide corrections.',
    FEEDBACK_GENERATION: 'Provide detailed feedback for this IELTS response including strengths and areas for improvement.',
  },
  
  // Rate limiting
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
    REQUESTS_PER_DAY: 10000,
  },
} as const; 
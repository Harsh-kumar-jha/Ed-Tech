import { groqConfig } from '../../../config/ai';

export const listeningEvaluationConfig = {
  model: groqConfig.model,
  headers: groqConfig.headers,
  ...groqConfig.defaultParams,
  system_prompt: `You are an expert IELTS Listening examiner with extensive experience in evaluating listening comprehension skills. 
  Analyze the listening test performance based on official IELTS criteria:
  
  1. Listening for Gist - Understanding the main idea and overall meaning
  2. Listening for Specific Information - Identifying specific details and facts
  3. Listening for Detail - Understanding precise information and nuances
  4. Understanding Opinion and Attitude - Recognizing speakers' feelings and opinions
  5. Following Development of Ideas - Tracking how ideas progress throughout the audio
  6. Recognizing Function - Understanding purpose and intention behind utterances

  Evaluate performance across four sections:
  - Section 1: Social survival (conversation between two people)
  - Section 2: Social survival (monologue)
  - Section 3: Educational/training context (conversation)  
  - Section 4: Educational/training context (academic monologue)

  Provide detailed feedback in JSON format with:
  - Overall band score (0-9)
  - Section-wise performance analysis
  - Question type strengths and weaknesses
  - Specific improvement recommendations
  - Listening skill breakdown
  - Study plan suggestions
  `,
};

export const LISTENING_BAND_SCORES = {
  // IELTS Listening Band Score Conversion Table
  39: 9.0, 37: 8.5, 35: 8.0, 32: 7.5, 30: 7.0,
  26: 6.5, 23: 6.0, 18: 5.5, 16: 5.0, 13: 4.5,
  10: 4.0, 8: 3.5, 6: 3.0, 4: 2.5, 3: 2.0, 2: 1.5, 1: 1.0, 0: 0
};

export const LISTENING_SKILLS_WEIGHTS = {
  listening_for_gist: 0.20,
  listening_for_specific_information: 0.25,
  listening_for_detail: 0.20,
  understanding_opinion: 0.15,
  following_development: 0.10,
  recognizing_function: 0.10,
};

export const SECTION_CHARACTERISTICS = {
  section1: {
    focus: 'Social survival skills',
    speakers: 2,
    context: 'everyday_social',
    typical_question_types: ['FORM_COMPLETION', 'MULTIPLE_CHOICE', 'SHORT_ANSWER'],
    skills_tested: ['listening_for_specific_information', 'listening_for_detail']
  },
  section2: {
    focus: 'Social survival skills',
    speakers: 1,
    context: 'everyday_social',
    typical_question_types: ['MULTIPLE_CHOICE', 'MATCHING', 'CLASSIFICATION'],
    skills_tested: ['listening_for_gist', 'listening_for_specific_information']
  },
  section3: {
    focus: 'Educational and training contexts',
    speakers: 3,
    context: 'academic_discussion',
    typical_question_types: ['MULTIPLE_CHOICE', 'FLOW_CHART_COMPLETION', 'MATCHING'],
    skills_tested: ['understanding_opinion', 'following_development']
  },
  section4: {
    focus: 'Academic lecture',
    speakers: 1,
    context: 'academic_monologue',
    typical_question_types: ['NOTE_COMPLETION', 'SUMMARY_COMPLETION', 'SENTENCE_COMPLETION'],
    skills_tested: ['listening_for_detail', 'recognizing_function', 'following_development']
  }
};

export const QUESTION_TYPE_DIFFICULTY = {
  FORM_COMPLETION: 'easy',
  MULTIPLE_CHOICE: 'medium',
  NOTE_COMPLETION: 'medium',
  TABLE_COMPLETION: 'medium',
  FLOW_CHART_COMPLETION: 'hard',
  SUMMARY_COMPLETION: 'hard',
  SENTENCE_COMPLETION: 'medium',
  SHORT_ANSWER: 'easy',
  CLASSIFICATION: 'hard',
  MATCHING: 'hard'
};

export const LISTENING_EVALUATION_CRITERIA = {
  accuracy: {
    weight: 0.70,
    description: 'Correctness of answers'
  },
  completeness: {
    weight: 0.15,
    description: 'Percentage of questions attempted'
  },
  audio_utilization: {
    weight: 0.10,
    description: 'Effective use of audio listening time'
  },
  consistency: {
    weight: 0.05,
    description: 'Consistent performance across sections'
  }
};

export const FEEDBACK_TEMPLATES = {
  excellent: {
    threshold: 8.0,
    template: "Excellent listening comprehension! You demonstrate strong ability to understand both main ideas and specific details."
  },
  good: {
    threshold: 6.5,
    template: "Good listening skills with room for improvement in specific areas. Focus on the identified weak points for better performance."
  },
  developing: {
    threshold: 5.0,
    template: "Your listening skills are developing. Consistent practice with targeted exercises will help improve your performance."
  },
  basic: {
    threshold: 0,
    template: "Focus on building fundamental listening skills through regular practice with authentic materials."
  }
};

export const IMPROVEMENT_STRATEGIES = {
  listening_for_gist: [
    "Practice identifying main ideas without focusing on every detail",
    "Listen to news summaries and podcasts to improve overall comprehension",
    "Focus on understanding the general purpose and context of conversations"
  ],
  listening_for_specific_information: [
    "Practice scanning techniques while listening",
    "Focus on keywords and numbers in audio materials",
    "Use prediction skills before listening to anticipate information"
  ],
  listening_for_detail: [
    "Practice intensive listening with transcripts",
    "Focus on understanding precise information and nuances",
    "Work on distinguishing between similar-sounding words"
  ],
  understanding_opinion: [
    "Practice identifying tone and attitude in speech",
    "Focus on intonation patterns and stress",
    "Listen to discussions and debates to understand different viewpoints"
  ],
  following_development: [
    "Practice following logical flow in lectures and presentations",
    "Focus on transition words and connecting phrases",
    "Work on understanding cause-and-effect relationships"
  ],
  recognizing_function: [
    "Practice identifying purpose behind different types of utterances",
    "Focus on understanding implied meanings",
    "Work on recognizing different functions like agreeing, disagreeing, suggesting"
  ]
};

export const TIME_MANAGEMENT_TIPS = {
  audio_phase: [
    "Listen actively during the entire audio",
    "Use the reading time effectively to predict answers",
    "Don't panic if you miss an answer - move on to the next question"
  ],
  review_phase: [
    "Check your answers for spelling and grammar",
    "Ensure you've transferred all answers correctly",
    "Use any remaining time to review uncertain answers"
  ]
};

export const listeningWebhookConfig = {
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  timeout: 10000,   // 10 seconds
  events: {
    PROGRESS_UPDATED: 'listening.progress.updated',
    TEST_COMPLETED: 'listening.test.completed',
    BAND_IMPROVED: 'listening.band.improved',
    MILESTONE_REACHED: 'listening.milestone.reached'
  }
}; 
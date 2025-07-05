import { openRouterConfig } from '../../../config/ai';

export const writingEvaluationConfig = {
  model: openRouterConfig.model,
  headers: openRouterConfig.headers,
  ...openRouterConfig.defaultParams,
  system_prompt: `You are an expert IELTS examiner with years of experience in evaluating writing tasks. 
  Evaluate the writing based on the official IELTS criteria:
  1. Task Achievement/Response
  2. Coherence and Cohesion
  3. Lexical Resource
  4. Grammatical Range and Accuracy

  Provide detailed feedback in JSON format with:
  - Overall band score
  - Individual criterion scores
  - Specific examples from the text
  - Areas of improvement
  - Strengths
  `,
};

export const WORD_COUNT_REQUIREMENTS = {
  task1: {
    academic: 150,
    general_training: 150,
  },
  task2: {
    academic: 250,
    general_training: 250,
  },
};

export const TIME_LIMITS = {
  task1: 1200, // 20 minutes in seconds
  task2: 2400, // 40 minutes in seconds
};

export const EVALUATION_CRITERIA = {
  taskAchievement: {
    weight: 0.25,
    descriptors: {
      9: 'Fully addresses all parts of the task with clear, developed ideas',
      8: 'Covers all requirements with well-developed response',
      7: 'Addresses all parts though some may be more fully covered',
      6: 'Addresses requirements but lacks focus in places',
      5: 'Only partially addresses the task',
      4: 'Attempts to address task but does not cover all requirements',
      3: 'Does not adequately address any part of the task',
      2: 'Barely addresses the task',
      1: 'Does not address the task',
    },
  },
  coherenceCohesion: {
    weight: 0.25,
    descriptors: {
      9: 'Cohesion used naturally, paragraphing excellent',
      8: 'Logical sequencing, cohesion well-managed',
      7: 'Information logically organized, cohesion evident',
      6: 'Coherent arrangement with effective cohesive devices',
      5: 'Organization present but not always logical',
      4: 'Information organized but connections unclear',
      3: 'Little evidence of organization',
      2: 'Very little organization evident',
      1: 'No evidence of organization',
    },
  },
  lexicalResource: {
    weight: 0.25,
    descriptors: {
      9: 'Wide range of vocabulary, natural and sophisticated usage',
      8: 'Flexible and precise vocabulary usage',
      7: 'Sufficient vocabulary for flexibility and precision',
      6: 'Adequate vocabulary for the task',
      5: 'Limited vocabulary but sufficient for basic communication',
      4: 'Vocabulary limited but adequate for familiar topics',
      3: 'Vocabulary inadequate except for basic communication',
      2: 'Extremely limited vocabulary',
      1: 'Vocabulary inadequate for any communication',
    },
  },
  grammaticalRange: {
    weight: 0.25,
    descriptors: {
      9: 'Wide range of structures with full flexibility and accuracy',
      8: 'Variety of complex structures with flexibility',
      7: 'Variety of structures with good control',
      6: 'Mix of simple and complex structures',
      5: 'Limited range of structures',
      4: 'Very limited range, frequent errors',
      3: 'Few structures attempted, errors predominant',
      2: 'Cannot use sentence forms except memorized phrases',
      1: 'No sentence forms attempted',
    },
  },
}; 
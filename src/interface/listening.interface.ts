import { DifficultyLevel, TestStatus } from '@prisma/client';

// ===========================
// LISTENING MODULE INTERFACES
// ===========================

export interface IListeningTest {
  id: string;
  testId: string;
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  audioUrl: string;
  audioFileName: string;
  audioFileSize: number;
  audioDuration: number;
  totalDuration: number;
  totalQuestions: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IListeningSection {
  id: string;
  testId: string;
  sectionNumber: number;
  title: string;
  description?: string;
  type: string;
  audioUrl?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  questionCount: number;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IListeningQuestion {
  id: string;
  sectionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  acceptableAnswers: string[];
  caseSensitive: boolean;
  points: number;
  audioTimestamp?: number;
  hints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IListeningTestAttempt {
  id: string;
  userId: string;
  testId: string;
  status: TestStatus;
  startedAt: Date;
  audioStartedAt?: Date;
  completedAt?: Date;
  submittedAt?: Date;
  timeSpent: number;
  audioTimeSpent: number;
  score?: number;
  totalScore: number;
  bandScore?: number;
  percentage?: number;
  currentSection: number;
  audioCompleted: boolean;
  warningShown: boolean;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IListeningAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  questionNumber: number;
  userAnswer: string;
  isCorrect?: boolean;
  pointsEarned: number;
  timeSpent: number;
  submittedAt: Date;
  aiEvaluation?: any;
  createdAt: Date;
}

export interface IListeningTestResult {
  id: string;
  userId: string;
  testId: string;
  attemptId: string;
  score: number;
  totalScore: number;
  bandScore: number;
  percentage: number;
  timeSpent: number;
  audioTimeSpent: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  sectionScores: any;
  questionTypeScores: any;
  strengths: string[];
  weaknesses: string[];
  audioUtilization: number;
  completionRate: number;
  aiSummary?: string;
  aiFeedback?: any;
  recommendations: string[];
  nextLevelSuggestion?: string;
  createdAt: Date;
}

export interface IListeningPerformanceAnalytics {
  id: string;
  userId: string;
  totalTests: number;
  averageBandScore?: number;
  bestBandScore?: number;
  latestBandScore?: number;
  averageTimeSpent?: number;
  averageAudioTime?: number;
  strongQuestionTypes: string[];
  weakQuestionTypes: string[];
  strongSections: string[];
  weakSections: string[];
  audioUtilizationRate?: number;
  completionRate?: number;
  lastTestDate?: Date;
  next24HourTest?: Date;
  progressTrend?: any;
  listeningSkills?: any;
  aiInsights?: any;
  studyPlan?: any;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// REQUEST/RESPONSE INTERFACES
// ===========================

export interface CreateListeningTestRequest {
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  sections: CreateListeningSectionRequest[];
}

export interface CreateListeningSectionRequest {
  sectionNumber: number;
  title: string;
  description?: string;
  type: string;
  audioStartTime?: number;
  audioEndTime?: number;
  instructions?: string;
  questions: CreateListeningQuestionRequest[];
}

export interface CreateListeningQuestionRequest {
  questionNumber: number;
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  caseSensitive?: boolean;
  points?: number;
  audioTimestamp?: number;
  hints?: string[];
}

export interface StartListeningTestRequest {
  testId: string;
}

export interface StartListeningTestResponse {
  success: boolean;
  data?: {
    attemptId: string;
    test: IListeningTest;
    sections: IListeningSection[];
    timeLimit: number;
    audioUrl: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface SubmitListeningAnswersRequest {
  attemptId: string;
  answers: {
    questionId: string;
    questionNumber: number;
    userAnswer: string;
    timeSpent?: number;
  }[];
}

export interface SubmitListeningAnswersResponse {
  success: boolean;
  data?: {
    result: IListeningTestResult;
    analytics: IListeningPerformanceAnalytics;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface ListeningAudioUploadRequest {
  testId?: string;
  sectionId?: string;
}

export interface ListeningAudioUploadResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    fileName: string;
    fileSize: number;
    duration?: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface GetListeningTestsResponse {
  success: boolean;
  data?: {
    tests: IListeningTest[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface GetListeningAnalyticsResponse {
  success: boolean;
  data?: {
    analytics: IListeningPerformanceAnalytics;
    recentTests: IListeningTestResult[];
    progressChart: {
      labels: string[];
      bandScores: number[];
      dates: string[];
    };
  };
  error?: {
    message: string;
    code: string;
  };
}

// ===========================
// SERVICE INTERFACES
// ===========================

export interface IListeningTestService {
  createTest(data: CreateListeningTestRequest, createdBy: string): Promise<IListeningTest>;
  uploadAudio(file: Express.Multer.File, testId: string): Promise<ListeningAudioUploadResponse>;
  getTestById(testId: string): Promise<IListeningTest | null>;
  updateTest(testId: string, data: Partial<IListeningTest>): Promise<IListeningTest>;
  deleteTest(testId: string): Promise<boolean>;
  getActiveTests(): Promise<IListeningTest[]>;
}

export interface IListeningSessionService {
  startTest(userId: string, testId: string): Promise<StartListeningTestResponse>;
  getActiveSession(userId: string): Promise<IListeningTestAttempt | null>;
  updateProgress(attemptId: string, data: Partial<IListeningTestAttempt>): Promise<IListeningTestAttempt>;
  submitAnswers(data: SubmitListeningAnswersRequest): Promise<SubmitListeningAnswersResponse>;
  abandonSession(attemptId: string): Promise<boolean>;
}

export interface IListeningEvaluationService {
  evaluateAnswers(attemptId: string, answers: IListeningAnswer[]): Promise<IListeningTestResult>;
  calculateBandScore(score: number, totalQuestions: number): number;
  generateFeedback(result: IListeningTestResult): Promise<any>;
  updateAnalytics(userId: string, result: IListeningTestResult): Promise<IListeningPerformanceAnalytics>;
}

// ===========================
// UTILITY INTERFACES
// ===========================

export interface AudioMetadata {
  duration: number;
  bitrate: string;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

export interface ListeningSessionState {
  attemptId: string;
  currentSection: number;
  audioProgress: number;
  timeRemaining: number;
  answersSubmitted: number;
  totalQuestions: number;
  warningShown: boolean;
}

export interface ListeningTestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BandScoreBreakdown {
  overall: number;
  sections: {
    section1: number;
    section2: number;
    section3: number;
    section4: number;
  };
  questionTypes: Record<string, number>;
}

export interface ListeningSkillAnalysis {
  listening_for_gist: number;
  listening_for_specific_information: number;
  listening_for_detail: number;
  understanding_opinion: number;
  following_development: number;
  recognizing_function: number;
}

export interface StudyRecommendation {
  priority: 'high' | 'medium' | 'low';
  skill: string;
  description: string;
  activities: string[];
  estimatedTime: string;
} 
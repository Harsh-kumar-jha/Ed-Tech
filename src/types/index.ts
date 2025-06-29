// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User types
export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  profileId?: string;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  dateOfBirth?: Date;
  phone?: string;
  country?: string;
  language?: string;
  timezone?: string;
  avatar?: string;
  bio?: string;
  targetScore?: number;
  currentLevel?: 'beginner' | 'intermediate' | 'advanced';
  studyGoals?: string[];
}

export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'student' | 'instructor';
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// IELTS Test types
export type IELTSModule = 'reading' | 'listening' | 'writing' | 'speaking';
export type TestStatus = 'not_started' | 'in_progress' | 'completed' | 'submitted' | 'graded' | 'expired';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface IELTSTest extends BaseEntity {
  title: string;
  description: string;
  module: IELTSModule;
  difficulty: DifficultyLevel;
  timeLimit: number; // in seconds
  totalQuestions: number;
  passingScore: number;
  instructions: string;
  isActive: boolean;
  createdBy: string;
}

export interface TestQuestion extends BaseEntity {
  testId: string;
  questionNumber: number;
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'audio_response';
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface TestAttempt extends BaseEntity {
  userId: string;
  testId: string;
  status: TestStatus;
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;
  timeSpent: number; // in seconds
  score?: number;
  totalScore: number;
  percentage?: number;
  answers: TestAnswer[];
  aiSummary?: string;
}

export interface TestAnswer {
  questionId: string;
  questionNumber: number;
  userAnswer: string;
  isCorrect?: boolean;
  pointsEarned: number;
  timeSpent: number;
  aiEvaluation?: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
}

// Leaderboard types
export interface LeaderboardEntry extends BaseEntity {
  userId: string;
  username: string;
  fullName: string;
  avatar?: string;
  totalScore: number;
  testsCompleted: number;
  averageScore: number;
  streak: number;
  rank: number;
  period: 'daily' | 'weekly' | 'monthly' | 'global';
}

// AI types
export interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  context?: any;
}

export interface AIResponse {
  response: string;
  model: string;
  tokensUsed: number;
  processingTime: number;
  confidence?: number;
}

export interface TestEvaluationRequest {
  testAttemptId: string;
  answers: TestAnswer[];
  testModule: IELTSModule;
}

export interface TestSummaryRequest {
  testAttemptId: string;
  userPerformance: {
    score: number;
    timeSpent: number;
    strengths: string[];
    weaknesses: string[];
  };
}

// File upload types
export interface FileUpload {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

// Socket types
export interface SocketUser {
  id: string;
  username: string;
  role: string;
}

export interface SocketMessage {
  event: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Request types with user context
export interface AuthenticatedRequest {
  user: User;
}

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  LOG_LEVEL: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  MAX_FILE_SIZE: number;
  ALLOWED_ORIGINS: string;
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Database transaction types
export type TransactionCallback<T> = (tx: any) => Promise<T>;

// Cache types
export interface CacheOptions {
  ttl?: number; // time to live in seconds
  namespace?: string;
}

// Metrics types
export interface Metrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

// Job queue types
export interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
} 
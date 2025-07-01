/**
 * IELTS domain interfaces
 */

import { BaseEntity } from './base.interface';
import { IELTSModule, TestStatus, DifficultyLevel } from '../types';

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
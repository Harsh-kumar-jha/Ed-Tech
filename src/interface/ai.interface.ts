/**
 * AI domain interfaces
 */

import { TestAnswer } from './ielts.interface';
import { IELTSModule } from '../types';

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
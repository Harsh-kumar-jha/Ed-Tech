import { PrismaClient } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { 
  LISTENING_BAND_SCORES,
  LISTENING_SKILLS_WEIGHTS,
  SECTION_CHARACTERISTICS,
  FEEDBACK_TEMPLATES,
  IMPROVEMENT_STRATEGIES,
  listeningEvaluationConfig
} from '../../AI/config/listening-evaluation.config';
import { 
  IListeningEvaluationService,
  IListeningAnswer,
  IListeningTestResult,
  IListeningPerformanceAnalytics,
  ListeningSkillAnalysis,
  BandScoreBreakdown
} from '../../../interface/listening.interface';
import { groqConfig } from '../../../config/ai';
import axios from 'axios';

export class ListeningEvaluationService implements IListeningEvaluationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Evaluate listening test answers and generate comprehensive results
   */
  async evaluateAnswers(attemptId: string, answers: any[]): Promise<IListeningTestResult> {
    try {
      // Get attempt details with test structure
      const attempt = await this.prisma.listeningTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              sections: {
                include: {
                  questions: true
                },
                orderBy: { sectionNumber: 'asc' }
              }
            }
          },
          user: true
        }
      });

      if (!attempt) {
        throw new AppError('Test attempt not found', HTTP_STATUS.NOT_FOUND);
      }

      // Evaluate each answer
      const evaluatedAnswers = await this.evaluateIndividualAnswers(answers, attempt.test.sections);
      
      // Calculate scores
      const scoreBreakdown = this.calculateScores(evaluatedAnswers, attempt.test.sections);
      
      // Generate band score
      const bandScore = this.calculateBandScore(scoreBreakdown.correctAnswers, attempt.test.totalQuestions);
      
      // Analyze performance by sections and question types
      const sectionScores = this.analyzeSectionPerformance(evaluatedAnswers, attempt.test.sections);
      const questionTypeScores = this.analyzeQuestionTypePerformance(evaluatedAnswers, attempt.test.sections);
      
      // Identify strengths and weaknesses
      const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses(sectionScores, questionTypeScores);
      
      // Calculate audio utilization
      const audioUtilization = this.calculateAudioUtilization(attempt.audioTimeSpent, attempt.test.audioDuration);
      
      // Generate AI feedback
      const feedbackData = {
        bandScore,
        sectionScores,
        questionTypeScores,
        audioUtilization,
        timeSpent: attempt.timeSpent,
        totalDuration: attempt.test.totalDuration
      };
      const aiFeedback = await this.generateFeedbackFromData(feedbackData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(weaknesses, bandScore);
      
      // Suggest next level
      const nextLevelSuggestion = this.suggestNextLevel(bandScore);

      // Create test result
      const result = await this.prisma.listeningTestResult.create({
        data: {
          userId: attempt.userId,
          testId: attempt.test.id,
          attemptId: attempt.id,
          score: scoreBreakdown.correctAnswers,
          totalScore: attempt.test.totalQuestions,
          bandScore,
          percentage: (scoreBreakdown.correctAnswers / attempt.test.totalQuestions) * 100,
          timeSpent: attempt.timeSpent,
          audioTimeSpent: attempt.audioTimeSpent,
          correctAnswers: scoreBreakdown.correctAnswers,
          wrongAnswers: scoreBreakdown.wrongAnswers,
          skippedAnswers: scoreBreakdown.skippedAnswers,
          sectionScores,
          questionTypeScores,
          strengths,
          weaknesses,
          audioUtilization,
          completionRate: (answers.length / attempt.test.totalQuestions) * 100,
          aiFeedback,
          recommendations,
          nextLevelSuggestion
        }
      });

      // Update attempt with final score
      await this.prisma.listeningTestAttempt.update({
        where: { id: attemptId },
        data: {
          score: scoreBreakdown.correctAnswers,
          bandScore,
          percentage: (scoreBreakdown.correctAnswers / attempt.test.totalQuestions) * 100
        }
      });

      return result;

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to evaluate listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calculate band score based on correct answers
   */
  calculateBandScore(correctAnswers: number, totalQuestions: number): number {
    return LISTENING_BAND_SCORES[correctAnswers] || 0;
  }

  /**
   * Generate AI-powered feedback
   */
  async generateFeedback(result: IListeningTestResult): Promise<any> {
    try {
      const feedbackData = {
        band_score: result.bandScore,
        section_scores: result.sectionScores,
        question_type_scores: result.questionTypeScores,
        audio_utilization: result.audioUtilization,
        completion_rate: result.completionRate,
        time_management: {
          time_spent: result.timeSpent,
          audio_time_spent: result.audioTimeSpent,
          efficiency: result.audioTimeSpent > 0 ? result.timeSpent / result.audioTimeSpent : 0
        }
      };

      const response = await this.makeAIRequest('/chat/completions', {
        model: listeningEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: listeningEvaluationConfig.system_prompt
          },
          {
            role: 'user',
            content: JSON.stringify(feedbackData)
          }
        ],
        temperature: listeningEvaluationConfig.temperature,
        max_tokens: listeningEvaluationConfig.max_tokens
      });

      return this.parseAIResponse(response.data.choices[0].message.content);

    } catch (error) {
      console.error('AI feedback generation failed:', error);
      return this.generateFallbackFeedback(result.bandScore);
    }
  }

  /**
   * Update user performance analytics
   */
  async updateAnalytics(userId: string, result: IListeningTestResult): Promise<IListeningPerformanceAnalytics> {
    try {
      // Get or create analytics record
      let analytics = await this.prisma.listeningPerformanceAnalytics.findUnique({
        where: { userId }
      });

      const isFirstTest = !analytics;

      if (!analytics) {
        analytics = await this.prisma.listeningPerformanceAnalytics.create({
          data: {
            userId,
            totalTests: 0,
            strongQuestionTypes: [],
            weakQuestionTypes: [],
            strongSections: [],
            weakSections: []
          }
        });
      }

      // Calculate updated metrics
      const newTotalTests = analytics.totalTests + 1;
      const newAverageBandScore = isFirstTest 
        ? result.bandScore 
        : ((analytics.averageBandScore || 0) * analytics.totalTests + result.bandScore) / newTotalTests;

      const newBestBandScore = Math.max(analytics.bestBandScore || 0, result.bandScore);
      const newAverageTimeSpent = isFirstTest
        ? result.timeSpent
        : ((analytics.averageTimeSpent || 0) * analytics.totalTests + result.timeSpent) / newTotalTests;

      const newAverageAudioTime = isFirstTest
        ? result.audioTimeSpent
        : ((analytics.averageAudioTime || 0) * analytics.totalTests + result.audioTimeSpent) / newTotalTests;

      // Update analytics
      const updatedAnalytics = await this.prisma.listeningPerformanceAnalytics.update({
        where: { userId },
        data: {
          totalTests: newTotalTests,
          averageBandScore: newAverageBandScore,
          bestBandScore: newBestBandScore,
          latestBandScore: result.bandScore,
          averageTimeSpent: newAverageTimeSpent,
          averageAudioTime: newAverageAudioTime,
          audioUtilizationRate: result.audioUtilization,
          completionRate: result.completionRate,
          lastTestDate: new Date(),
          // Update next test time for premium users (24 hours later)
          next24HourTest: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return updatedAnalytics;

    } catch (error: any) {
      throw new AppError('Failed to update analytics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Private helper methods

  private async evaluateIndividualAnswers(answers: any[], sections: any[]) {
    const evaluatedAnswers = [];

    for (const answer of answers) {
      // Find the corresponding question
      const question = this.findQuestionById(answer.questionId, sections);
      if (!question) continue;

      // Evaluate answer
      const isCorrect = this.evaluateAnswer(answer.userAnswer, question);
      const pointsEarned = isCorrect ? question.points : 0;

      // Update answer record
      await this.prisma.listeningAnswer.update({
        where: { id: answer.id },
        data: {
          isCorrect,
          pointsEarned
        }
      });

      evaluatedAnswers.push({
        ...answer,
        isCorrect,
        pointsEarned,
        question
      });
    }

    return evaluatedAnswers;
  }

  private findQuestionById(questionId: string, sections: any[]) {
    for (const section of sections) {
      const question = section.questions.find((q: any) => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  private evaluateAnswer(userAnswer: string, question: any): boolean {
    const normalizedUserAnswer = userAnswer.trim();
    
    if (!normalizedUserAnswer) return false;

    // Check against correct answer
    const correctAnswer = question.caseSensitive 
      ? question.correctAnswer 
      : question.correctAnswer.toLowerCase();
    
    const checkAnswer = question.caseSensitive 
      ? normalizedUserAnswer 
      : normalizedUserAnswer.toLowerCase();

    if (checkAnswer === correctAnswer) return true;

    // Check against acceptable alternatives
    if (question.acceptableAnswers && question.acceptableAnswers.length > 0) {
      return question.acceptableAnswers.some((acceptable: string) => {
        const normalizedAcceptable = question.caseSensitive 
          ? acceptable 
          : acceptable.toLowerCase();
        return checkAnswer === normalizedAcceptable;
      });
    }

    return false;
  }

  private calculateScores(evaluatedAnswers: any[], sections: any[]) {
    const correctAnswers = evaluatedAnswers.filter(a => a.isCorrect).length;
    const wrongAnswers = evaluatedAnswers.filter(a => !a.isCorrect && a.userAnswer.trim() !== '').length;
    const skippedAnswers = sections.reduce((total, section) => total + section.questions.length, 0) - evaluatedAnswers.length;

    return { correctAnswers, wrongAnswers, skippedAnswers };
  }

  private analyzeSectionPerformance(evaluatedAnswers: any[], sections: any[]) {
    const sectionScores: any = {};

    sections.forEach(section => {
      const sectionAnswers = evaluatedAnswers.filter(answer => 
        section.questions.some((q: any) => q.id === answer.questionId)
      );
      
      const sectionCorrect = sectionAnswers.filter(a => a.isCorrect).length;
      const sectionTotal = section.questions.length;
      
      sectionScores[`section${section.sectionNumber}`] = {
        correct: sectionCorrect,
        total: sectionTotal,
        percentage: sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0
      };
    });

    return sectionScores;
  }

  private analyzeQuestionTypePerformance(evaluatedAnswers: any[], sections: any[]) {
    const questionTypeScores: any = {};

    evaluatedAnswers.forEach(answer => {
      const questionType = answer.question.questionType;
      
      if (!questionTypeScores[questionType]) {
        questionTypeScores[questionType] = { correct: 0, total: 0 };
      }
      
      questionTypeScores[questionType].total++;
      if (answer.isCorrect) {
        questionTypeScores[questionType].correct++;
      }
    });

    // Calculate percentages
    Object.keys(questionTypeScores).forEach(type => {
      const stats = questionTypeScores[type];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    return questionTypeScores;
  }

  private identifyStrengthsAndWeaknesses(sectionScores: any, questionTypeScores: any) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze sections
    Object.entries(sectionScores).forEach(([section, scores]: [string, any]) => {
      if (scores.percentage >= 70) {
        strengths.push(`Strong performance in ${section}`);
      } else if (scores.percentage < 50) {
        weaknesses.push(`Needs improvement in ${section}`);
      }
    });

    // Analyze question types
    Object.entries(questionTypeScores).forEach(([type, scores]: [string, any]) => {
      if (scores.percentage >= 70) {
        strengths.push(`Good at ${type} questions`);
      } else if (scores.percentage < 50) {
        weaknesses.push(`Struggles with ${type} questions`);
      }
    });

    return { strengths, weaknesses };
  }

  private calculateAudioUtilization(audioTimeSpent: number, audioDuration: number): number {
    if (audioDuration === 0) return 0;
    return Math.min((audioTimeSpent / audioDuration) * 100, 100);
  }

  private generateRecommendations(weaknesses: string[], bandScore: number): string[] {
    const recommendations: string[] = [];

    // Band-specific recommendations
    if (bandScore < 5.0) {
      recommendations.push(...IMPROVEMENT_STRATEGIES.listening_for_gist);
    } else if (bandScore < 6.5) {
      recommendations.push(...IMPROVEMENT_STRATEGIES.listening_for_specific_information);
    } else if (bandScore < 8.0) {
      recommendations.push(...IMPROVEMENT_STRATEGIES.understanding_opinion);
    }

    // Add weakness-specific recommendations
    if (weaknesses.length > 0) {
      recommendations.push("Focus on your identified weak areas through targeted practice");
    }

    return recommendations;
  }

  private suggestNextLevel(bandScore: number): string {
    if (bandScore < 5.0) return 'Practice basic listening comprehension';
    if (bandScore < 6.5) return 'Work on intermediate listening skills';
    if (bandScore < 7.5) return 'Focus on advanced listening techniques';
    if (bandScore < 8.5) return 'Refine expert-level listening skills';
    return 'Maintain excellence through regular practice';
  }

  private async makeAIRequest(endpoint: string, data: any) {
    try {
      const response = await axios.post(
        `${groqConfig.baseUrl}${endpoint}`,
        data,
        {
          headers: listeningEvaluationConfig.headers,
          timeout: 30000
        }
      );
      return response;
    } catch (error) {
      throw new Error('AI service request failed');
    }
  }

  private parseAIResponse(content: string) {
    try {
      return JSON.parse(content);
    } catch (error) {
      return { summary: content };
    }
  }

  private generateFallbackFeedback(bandScore: number) {
    const template = Object.values(FEEDBACK_TEMPLATES).find(t => bandScore >= t.threshold) || FEEDBACK_TEMPLATES.basic;
    return {
      summary: template.template,
      band_score: bandScore,
      recommendations: this.generateRecommendations([], bandScore)
    };
  }

  private async generateFeedbackFromData(feedbackData: any) {
    try {
      const response = await this.makeAIRequest('/chat/completions', {
        model: listeningEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: listeningEvaluationConfig.system_prompt
          },
          {
            role: 'user',
            content: JSON.stringify(feedbackData)
          }
        ],
        temperature: listeningEvaluationConfig.temperature,
        max_tokens: listeningEvaluationConfig.max_tokens
      });

      return this.parseAIResponse(response.data.choices[0].message.content);

    } catch (error) {
      console.error('AI feedback generation failed:', error);
      return this.generateFallbackFeedback(feedbackData.bandScore);
    }
  }
} 
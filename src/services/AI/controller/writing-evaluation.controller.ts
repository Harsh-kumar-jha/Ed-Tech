import { Request, Response } from 'express';
import { getPrisma } from '../../../db/database';
import { writingEvaluationConfig, webhookConfig } from '../config/writing-evaluation.config';
import { TokenService } from '../../Auth/services/token.service';
import { AIError } from '../../../utils/exceptions';
import { WritingCleanupService } from '../services/writing-cleanup.service';
import { APIKeyManagerService } from '../services/api-key-manager.service';
import { TestQuotaService } from '../services/test-quota.service';
import { WebhookService } from '../services/webhook.service';
import axios from 'axios';
import { groqConfig } from '../../../config/ai';
import { SubscriptionTier, DifficultyLevel } from '@prisma/client';

// Define valid test types and task types
const VALID_TEST_TYPES = ['academic', 'general_training'] as const;
const VALID_ACADEMIC_TASK_TYPES = ['line_graph', 'bar_chart', 'pie_chart', 'table', 'process', 'map', 'mixed'];
const VALID_GENERAL_TASK_TYPES = ['formal_letter', 'semi_formal_letter', 'informal_letter'];

type TestType = typeof VALID_TEST_TYPES[number];
type TaskType = typeof VALID_ACADEMIC_TASK_TYPES[number] | typeof VALID_GENERAL_TASK_TYPES[number];

interface WritingTask1Template {
  id: string;
  type: string;
  prompt: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

interface Task1Response {
  type: string;
  prompt: string;
  imageUrl?: string;
  letterScenario?: string;
  suggestedStructure?: {
    opening: string;
    closing: string;
  };
}

interface TaskFeedback {
  strengths: string[];
  improvements: string[];
  feedback: string;
  band: number;
}

export class WritingEvaluationController {
  private prisma = getPrisma();
  private tokenService = new TokenService();
  private cleanupService = new WritingCleanupService();
  private apiKeyManager = APIKeyManagerService.getInstance();
  private testQuota = TestQuotaService.getInstance();
  private webhookService = WebhookService.getInstance();

  async startWritingTest(req: Request, res: Response) {
    try {
      const { test_type = 'academic', task1_type } = req.body;
      const userId = (req.user as any).id;

      // Validate test_type
      if (!VALID_TEST_TYPES.includes(test_type as TestType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid test_type. Must be one of: ${VALID_TEST_TYPES.join(', ')}`
          }
        });
      }

      // Validate task1_type if provided
      if (task1_type) {
        const validTypes = test_type === 'academic' ? VALID_ACADEMIC_TASK_TYPES : VALID_GENERAL_TASK_TYPES;
        if (!validTypes.includes(task1_type)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: `Invalid task1_type for ${test_type}. Must be one of: ${validTypes.join(', ')}`
            }
          });
        }
      }

      // Check user's test quota
      const quotaStatus = await this.testQuota.getQuotaStatus(userId);
      if (!quotaStatus.hasQuota) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Test quota exceeded',
            details: {
              remainingTests: quotaStatus.remainingTests,
              totalTests: quotaStatus.totalTests,
              isSubscribed: quotaStatus.isSubscribed
            }
          }
        });
      }

      // Check if AI service is available
      if (this.apiKeyManager.areAllKeysExhausted()) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'AI service is currently unavailable'
          }
        });
      }

      // Get Task 1 template based on type and preferences
      const task1Template = await this.getTask1Template(test_type as TestType, task1_type);
      if (!task1Template) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No suitable Task 1 templates available'
          }
        });
      }

      // Create test session
      const test = await this.prisma.writingTest.create({
        data: {
          userId,
          testType: test_type,
          task1Prompt: task1Template.prompt,
          status: 'pending',
          testSessionId: `WT-${Date.now()}-${userId}`,
        },
      });

      // Schedule cleanup
      await this.cleanupService.scheduleCleanup(test.testSessionId);

      // Start async Task 2 generation
      await this.generateTask2Async(test.testSessionId, test.testType);

      // Increment test count
      await this.testQuota.incrementTestCount(userId);

      // Prepare response based on test type
      const task1Response: Task1Response = test_type === 'academic' ? {
        type: task1Template.type,
        prompt: task1Template.prompt,
        imageUrl: task1Template.imageUrl
      } : {
        type: task1Template.type,
        prompt: task1Template.prompt,
        letterScenario: task1Template.prompt,
        suggestedStructure: {
          opening: 'Dear Sir/Madam,',
          closing: 'Yours faithfully,'
        }
      };

      return res.status(200).json({
        success: true,
        data: {
          testSessionId: test.testSessionId,
          task1: task1Response,
          timeLimit: 1200, // 20 minutes in seconds
          quotaStatus: {
            remainingTests: quotaStatus.remainingTests - 1,
            totalTests: quotaStatus.totalTests + 1,
            isSubscribed: quotaStatus.isSubscribed
          },
          testType: test_type
        }
      });
    } catch (error) {
      console.error('Failed to start writing test:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to start writing test'
        }
      });
    }
  }

  private async getTask1Template(testType: TestType, preferredType?: string): Promise<WritingTask1Template | null> {
    const validTypes = testType === 'academic' ? VALID_ACADEMIC_TASK_TYPES : VALID_GENERAL_TASK_TYPES;
    
    const whereClause = {
      isActive: true,
      type: preferredType || {
        in: validTypes
      }
    };

    // Get count of matching templates
    const count = await this.prisma.writingTask1Template.count({
      where: whereClause
    });

    if (count === 0) {
      // If no templates found with preferred type, try without type restriction
      if (preferredType) {
        // Pass both arguments to avoid linter error
        return this.getTask1Template(testType, '');
      }
      return null;
    }

    // Get random template
    const randomSkip = Math.floor(Math.random() * count);
    const [template] = await this.prisma.writingTask1Template.findMany({
      where: whereClause,
      take: 1,
      skip: randomSkip,
    });

    return template;
  }

  private async generateTask2Async(testSessionId: string, testType: string): Promise<void> {
    try {
      // Generate Task 2
      const task2Prompt = await this.generateTask2(testType);

      // Update test session with Task 2
      await this.prisma.writingTest.update({
        where: { testSessionId },
        data: {
          task2Prompt,
        },
      });
    } catch (error) {
      console.error(`Failed to generate Task 2 for session ${testSessionId}:`, error);
      // We don't throw here since this is an async operation
    }
  }

  async evaluateTask1(req: Request, res: Response) {
    try {
      const {
        test_session_id,
        user_response,
        word_count,
        time_taken,
      } = req.body;

      const test = await this.prisma.writingTest.findUnique({
        where: { testSessionId: test_session_id },
      });

      if (!test) {
        return res.status(404).json({ error: 'Test session not found' });
      }

      // Check if Task 2 is ready
      if (!test.task2Prompt) {
        // If Task 2 isn't ready yet, generate it now
        const task2Prompt = await this.generateTask2(test.testType);
        await this.prisma.writingTest.update({
          where: { testSessionId: test_session_id },
          data: { task2Prompt },
        });
      }

      // Evaluate Task 1
      const evaluation = await this.evaluateWritingTask({
        task_type: 'task1',
        task_prompt: test.task1Prompt,
        user_response,
        word_count,
        time_taken,
        test_type: test.testType,
      });

      // Store results
      await this.prisma.writingTest.update({
        where: { testSessionId: test_session_id },
        data: {
          task1Response: user_response,
          task1Band: evaluation.overall_band,
          task1Feedback: evaluation.detailed_feedback,
          task1CompletedAt: new Date(),
          status: 'task1_completed',
        },
      });

      // Return Task 2 prompt along with evaluation
      return res.status(200).json({
        evaluation,
        task2Prompt: test.task2Prompt,
        timeLimit: 40 * 60, // 40 minutes in seconds
      });
    } catch (error) {
      console.error('Task 1 evaluation error:', error);
      return res.status(500).json({
        error: 'Evaluation failed',
        status: 'evaluation_failed',
      });
    }
  }

  async evaluateTask2(req: Request, res: Response) {
    try {
      const {
        test_session_id,
        user_response,
        word_count,
        time_taken,
      } = req.body;

      const test = await this.prisma.writingTest.findUnique({
        where: { testSessionId: test_session_id },
      });

      if (!test) {
        return res.status(404).json({ error: 'Test session not found' });
      }

      // Evaluate Task 2
      const evaluation = await this.evaluateWritingTask({
        task_type: 'task2',
        task_prompt: test.task2Prompt,
        user_response,
        word_count,
        time_taken,
        test_type: test.testType,
      });

      // Calculate combined band score
      const combinedBand = this.calculateCombinedBand(test.task1Band, evaluation.overall_band);
      const overallFeedback = await this.generateOverallFeedback(test.task1Feedback, evaluation.detailed_feedback);

      // Store results
      await this.prisma.writingTest.update({
        where: { testSessionId: test_session_id },
        data: {
          task2Response: user_response,
          task2Band: evaluation.overall_band,
          task2Feedback: evaluation.detailed_feedback,
          task2CompletedAt: new Date(),
          combinedBand,
          overallFeedback,
          status: 'evaluated',
          evaluatedAt: new Date(),
        },
      });

      // Update progress tracking
      await this.updateProgressTracking(test.userId);

      // Get progress analysis if available
      const progressAnalysis = await this.getProgressAnalysis(test.userId);

      return res.status(200).json({
        task2Evaluation: evaluation,
        combinedBand,
        overallFeedback,
        progressAnalysis,
      });
    } catch (error) {
      console.error('Task 2 evaluation error:', error);
      return res.status(500).json({
        error: 'Evaluation failed',
        status: 'evaluation_failed',
      });
    }
  }

  private async makeAIRequest(endpoint: string, data: any) {
    try {
      const apiKey = this.apiKeyManager.getCurrentKey();
      const response = await axios.post(
        `${groqConfig.baseUrl}${endpoint}`,
        data,
        {
          headers: {
            ...writingEvaluationConfig.headers,
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      this.apiKeyManager.incrementUsage();
      return response;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limit exceeded, try with next key
        this.apiKeyManager.incrementUsage(); // This will mark current key as exhausted
        return this.makeAIRequest(endpoint, data); // Retry with next key
      }
      throw error;
    }
  }

  private async generateTask1(testType: string): Promise<string> {
    try {
      const response = await this.makeAIRequest('/chat/completions', {
        model: writingEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an IELTS examiner. Generate a Task 1 writing prompt.',
          },
          {
            role: 'user',
            content: `Generate an IELTS Writing Task 1 prompt for ${testType} test.`,
          },
        ],
      });

      return this.parseAIResponse(response.data.choices[0].message.content, null);
    } catch (error) {
      throw new AIError('Failed to generate Task 1');
    }
  }

  private async generateTask2(testType: string): Promise<string> {
    try {
      const response = await this.makeAIRequest('/chat/completions', {
        model: writingEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an IELTS examiner. Generate a Task 2 writing prompt.',
          },
          {
            role: 'user',
            content: `Generate an IELTS Writing Task 2 prompt for ${testType} test.`,
          },
        ],
      });

      return this.parseAIResponse(response.data.choices[0].message.content, null);
    } catch (error) {
      throw new AIError('Failed to generate Task 2');
    }
  }

  private async evaluateWritingTask(data: any) {
    try {
      const response = await this.makeAIRequest('/chat/completions', {
        model: writingEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: writingEvaluationConfig.system_prompt,
          },
          {
            role: 'user',
            content: JSON.stringify(data),
          },
        ],
        temperature: writingEvaluationConfig.temperature,
        max_tokens: writingEvaluationConfig.max_tokens,
        top_p: writingEvaluationConfig.top_p,
        frequency_penalty: writingEvaluationConfig.frequency_penalty,
        presence_penalty: writingEvaluationConfig.presence_penalty,
      });

      return this.parseAIResponse(response.data.choices[0].message.content, null);
    } catch (error) {
      throw new AIError('Failed to get AI evaluation');
    }
  }

  private parseAIResponse(content: string, error: Error | null = null) {
    try {
      if (error) {
        throw error;
      }
      const parsed = JSON.parse(content);
      return parsed;
    } catch (parseError) {
      throw new AIError('Failed to parse AI response');
    }
  }

  private async storeEvaluation({ userId, testSessionId, taskType, evaluation }) {
    const updateData = taskType === 'task1' 
      ? {
          task1Response: evaluation.user_response,
          task1Band: evaluation.overall_band,
          task1Feedback: evaluation.detailed_feedback,
          task1CompletedAt: new Date(),
          status: 'task1_completed',
        }
      : {
          task2Response: evaluation.user_response,
          task2Band: evaluation.overall_band,
          task2Feedback: evaluation.detailed_feedback,
          task2CompletedAt: new Date(),
          status: 'task2_completed',
          combinedBand: this.calculateCombinedBand(evaluation.task1Band || 0, evaluation.overall_band),
          evaluatedAt: new Date(),
        };

    await this.prisma.writingTest.update({
      where: { testSessionId },
      data: updateData,
    });

    // Update progress tracking
    await this.updateProgressTracking(userId);
  }

  private async getPreviousTests(userId: string) {
    return await this.prisma.writingTest.findMany({
      where: {
        userId,
        status: 'task2_completed',
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
      take: 5,
    });
  }

  private async generateProgressAnalysis(previousTests) {
    const bands = previousTests.map(test => test.combinedBand);
    const trend = this.calculateTrend(bands);
    
    return {
      trend,
      consistent_strengths: this.identifyStrengths(previousTests),
      persistent_weaknesses: this.identifyWeaknesses(previousTests),
      recommended_focus: this.determineRecommendedFocus(previousTests),
      study_plan: this.generateStudyPlan(previousTests),
    };
  }

  private async generateCurrentPerformance(evaluation) {
    return {
      overall_assessment: this.generateOverallAssessment(evaluation),
      key_focus_areas: this.identifyKeyFocusAreas(evaluation),
      quick_wins: this.identifyQuickWins(evaluation),
      foundation_building: this.identifyFoundationSkills(evaluation),
    };
  }

  private calculateTrend(bands: number[]): 'improving' | 'stable' | 'declining' {
    const differences = bands.slice(0, -1).map((band, i) => bands[i + 1] - band);
    const average = differences.reduce((a, b) => a + b, 0) / differences.length;
    
    if (average > 0.2) return 'improving';
    if (average < -0.2) return 'declining';
    return 'stable';
  }

  private prepareEvaluationPrompt(data: any): string {
    return JSON.stringify({
      ...data,
      evaluation_criteria: 'Please evaluate this response according to official IELTS criteria',
    });
  }

  private calculateCombinedBand(task1Band: number, task2Band: number): number {
    // Task 2 is weighted more heavily (2/3) than Task 1 (1/3)
    const combinedBand = (task1Band + (2 * task2Band)) / 3;
    return Math.round(combinedBand * 2) / 2; // Round to nearest 0.5
  }

  // Helper methods for analysis
  private identifyStrengths(tests: any[]): string[] {
    // Implementation for identifying consistent strengths
    return [];
  }

  private identifyWeaknesses(tests: any[]): string[] {
    // Implementation for identifying persistent weaknesses
    return [];
  }

  private determineRecommendedFocus(tests: any[]): string {
    // Implementation for determining recommended focus area
    return '';
  }

  private generateStudyPlan(tests: any[]): string {
    // Implementation for generating study plan
    return '';
  }

  private generateOverallAssessment(evaluation: any): string {
    // Implementation for generating overall assessment
    return '';
  }

  private identifyKeyFocusAreas(evaluation: any): string[] {
    // Implementation for identifying key focus areas
    return [];
  }

  private identifyQuickWins(evaluation: any): string[] {
    // Implementation for identifying quick wins
    return [];
  }

  private identifyFoundationSkills(evaluation: any): string[] {
    // Implementation for identifying foundation skills
    return [];
  }

  private async generateOverallFeedback(task1Feedback: any, task2Feedback: any): Promise<any> {
    try {
      const response = await this.makeAIRequest('/chat/completions', {
        model: writingEvaluationConfig.model,
        messages: [
          {
            role: 'system',
            content: 'Generate comprehensive feedback combining Task 1 and Task 2 evaluations.',
          },
          {
            role: 'user',
            content: JSON.stringify({ task1Feedback, task2Feedback }),
          },
        ],
      });

      return this.parseAIResponse(response.data.choices[0].message.content, null);
    } catch (error) {
      throw new AIError('Failed to generate overall feedback');
    }
  }

  private async getProgressAnalysis(userId: string) {
    const previousTests = await this.prisma.writingTest.findMany({
      where: {
        userId,
        status: 'evaluated',
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
      take: 5,
    });

    if (previousTests.length >= 5) {
      return await this.generateProgressAnalysis(previousTests);
    }

    return await this.generateCurrentPerformance(previousTests[0]);
  }

  private async updateProgressTracking(userId: string) {
    const tests = await this.prisma.writingTest.findMany({
      where: { userId },
      select: { combinedBand: true },
    });

    const bands = tests.map(t => t.combinedBand).filter(Boolean);
    if (bands.length === 0) return;

    const averageBand = bands.reduce((a, b) => a + b, 0) / bands.length;
    const bestBand = Math.max(...bands);

    await this.prisma.writingProgress.upsert({
      where: { userId },
      update: {
        testCount: tests.length,
        averageBand,
        bestBand,
        progressAnalysis: await this.generateProgressAnalysis(tests),
      },
      create: {
        userId,
        testCount: tests.length,
        averageBand,
        bestBand,
      },
    });
  }

  /**
   * Get user's writing progress analysis
   * Requires at least 5 completed tests
   */
  async getProgress(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;

      // Get completed tests
      const completedTests = await this.prisma.writingTest.findMany({
        where: {
          userId,
          status: 'evaluated',
          task2CompletedAt: { not: null },
          combinedBand: { not: null }
        },
        orderBy: {
          task2CompletedAt: 'desc'
        }
      });

      // Get user's subscription info
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      // Check if user has enough tests
      if (completedTests.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No completed tests found for analysis'
          }
        });
      }

      const isPremium = user?.subscriptionTier === SubscriptionTier.PREMIUM && 
                       user?.subscriptionStatus === 'active' &&
                       (!user?.subscriptionEndDate || user?.subscriptionEndDate > new Date());

      // For premium users, check premium test count
      if (isPremium && user.premiumTestCount < 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PREMIUM_DATA',
            message: `Premium users need at least 5 tests completed during premium subscription. Currently have ${user.premiumTestCount} premium tests.`,
            details: {
              completed_premium_tests: user.premiumTestCount,
              required_premium_tests: 5,
              remaining_premium_tests: 5 - user.premiumTestCount,
              subscription_tier: user.subscriptionTier,
              subscription_status: user.subscriptionStatus
            }
          }
        });
      }
      
      // For free users, check total test count
      if (!isPremium && completedTests.length < 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: `Need at least 5 completed tests for progress analysis. Currently have ${completedTests.length} tests.`,
            details: {
              completed_tests: completedTests.length,
              required_tests: 5,
              remaining_tests: 5 - completedTests.length,
              subscription_tier: user?.subscriptionTier,
              subscription_status: user?.subscriptionStatus
            }
          }
        });
      }

      // Get last 5 tests for analysis
      const recentTests = completedTests.slice(0, 5);

      // Calculate overall progress
      const overallProgress = {
        tests_completed: completedTests.length,
        average_band: this.calculateAverageBand(recentTests),
        best_band: Math.max(...recentTests.map(t => t.combinedBand || 0)),
        trend: this.calculateTrend(recentTests.map(t => t.combinedBand || 0)),
        progress_percentage: this.calculateProgressPercentage(recentTests)
      };

      // Analyze skills
      const skillAnalysis = {
        task_achievement: await this.analyzeSkill(recentTests, 'task_achievement'),
        coherence_cohesion: await this.analyzeSkill(recentTests, 'coherence_cohesion'),
        lexical_resource: await this.analyzeSkill(recentTests, 'lexical_resource'),
        grammatical_range: await this.analyzeSkill(recentTests, 'grammatical_range')
      };

      // Generate improvement plan
      const improvementPlan = {
        immediate_focus: await this.generateImmediateFocus(recentTests),
        medium_term_goals: await this.generateMediumTermGoals(recentTests),
        long_term_goals: await this.generateLongTermGoals(recentTests)
      };

      // Generate personalized tips
      const personalizedTips = {
        strengths_to_maintain: this.identifyStrengths(recentTests),
        quick_wins: this.identifyQuickWins(recentTests),
        common_mistakes: await this.analyzeCommonMistakes(recentTests)
      };

      // Prepare test history
             const testHistory = recentTests.map(test => ({
        test_date: test.task2CompletedAt,
        test_type: test.testType,
        band_score: test.combinedBand,
        key_strengths: this.extractKeyStrengths(test),
        key_improvements: this.extractKeyImprovements(test)
      }));

      return res.status(200).json({
        success: true,
        data: {
          overall_progress: overallProgress,
          skill_analysis: skillAnalysis,
          improvement_plan: improvementPlan,
          personalized_tips: personalizedTips,
          test_history: testHistory
        }
      });

    } catch (error) {
      console.error('Failed to get progress analysis:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate progress analysis'
        }
      });
    }
  }

  /**
   * Configure webhook URL for progress notifications
   */
  async configureWebhook(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const { webhookUrl, webhookSecret } = req.body;

      // Validate webhook URL
      if (!this.isValidUrl(webhookUrl)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_WEBHOOK_URL',
            message: 'Invalid webhook URL format'
          }
        });
      }

      // Get user's subscription status
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true
        }
      });

      // Check if user has webhook access
      if (user?.subscriptionTier !== SubscriptionTier.PREMIUM || user?.subscriptionStatus !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'Webhooks are only available for active premium users'
          }
        });
      }

      // Update webhook configuration
      await this.prisma.$transaction(async (tx) => {
        const profile = await tx.userProfile.findUnique({
          where: { userId }
        });

        if (!profile) {
          await tx.userProfile.create({
            data: {
              userId,
              language: 'en',
              timezone: 'UTC',
              currentLevel: DifficultyLevel.BEGINNER,
              studyGoals: [],
              webhookUrl: webhookUrl as string,
              webhookSecret: webhookSecret as string
            }
          });
        } else {
          await tx.userProfile.update({
            where: { id: profile.id },
            data: {
              webhookUrl: webhookUrl as string,
              webhookSecret: webhookSecret as string
            }
          });
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Webhook configuration updated successfully'
      });
    } catch (error) {
      console.error('Failed to configure webhook:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to configure webhook'
        }
      });
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private calculateAverageBand(tests: any[]): number {
    const sum = tests.reduce((acc, test) => acc + (test.combinedBand || 0), 0);
    return Number((sum / tests.length).toFixed(1));
  }

  private calculateProgressPercentage(tests: any[]): number {
    const firstTest = tests[tests.length - 1].combinedBand || 0;
    const lastTest = tests[0].combinedBand || 0;
    const improvement = lastTest - firstTest;
    return Number((improvement / firstTest * 100).toFixed(1));
  }

  private async analyzeSkill(tests: any[], skill: string) {
    const scores = tests.map(test => {
      const feedback = test.task2Feedback || {};
      return feedback[skill]?.score || 0;
    });

    return {
      average_score: this.calculateAverageBand(scores),
      trend: this.calculateTrend(scores),
      consistent_strengths: this.identifyConsistentStrengths(tests, skill),
      areas_for_improvement: this.identifyAreasForImprovement(tests, skill)
    };
  }

  private async analyzeCommonMistakes(tests: any[]) {
    // Analyze feedback from all tests to identify patterns
    const allFeedback = tests.flatMap(test => {
      const t1 = test.task1Feedback || {};
      const t2 = test.task2Feedback || {};
      return [...(t1.mistakes || []), ...(t2.mistakes || [])];
    });

    // Group similar mistakes and get the most common ones
    const commonPatterns = this.groupSimilarMistakes(allFeedback);
    
    return commonPatterns.map(pattern => ({
      pattern: pattern.description,
      suggestion: pattern.suggestion,
      examples: pattern.examples
    }));
  }

  private groupSimilarMistakes(mistakes: any[]) {
    // Implementation to group similar mistakes and provide examples
    // This would use NLP or pattern matching to identify similar issues
    return [];
  }

  private extractKeyStrengths(test: any): string[] {
    const strengths = [];
    const t1 = test.task1Feedback || {};
    const t2 = test.task2Feedback || {};

    // Extract strengths from both tasks
    if (t1.strengths) strengths.push(...t1.strengths);
    if (t2.strengths) strengths.push(...t2.strengths);

    // Return unique strengths
    return [...new Set(strengths)];
  }

  private extractKeyImprovements(test: any): string[] {
    const improvements = [];
    const t1 = test.task1Feedback || {};
    const t2 = test.task2Feedback || {};

    // Extract improvements from both tasks
    if (t1.improvements) improvements.push(...t1.improvements);
    if (t2.improvements) improvements.push(...t2.improvements);

    // Return unique improvements
    return [...new Set(improvements)];
  }

  private async generateImmediateFocus(tests: any[]): Promise<string[]> {
    // Identify areas that need immediate attention based on recent performance
    const recentWeaknesses = this.identifyWeaknesses(tests);
    return recentWeaknesses.slice(0, 3); // Return top 3 immediate focus areas
  }

  private async generateMediumTermGoals(tests: any[]): Promise<string[]> {
    // Identify areas that need sustained improvement
    const consistentWeaknesses = tests
      .flatMap(test => this.extractKeyImprovements(test))
      .filter(improvement => 
        tests.every(test => 
          this.extractKeyImprovements(test).includes(improvement)
        )
      );
    return consistentWeaknesses;
  }

  private async generateLongTermGoals(tests: any[]): Promise<string[]> {
    // Identify foundational skills that need development
    return this.identifyFoundationSkills(tests);
  }

  private identifyConsistentStrengths(tests: any[], skill: string): string[] {
    // Find strengths that appear consistently across tests
    return tests
      .flatMap(test => this.extractKeyStrengths(test))
      .filter(strength => 
        tests.every(test => 
          this.extractKeyStrengths(test).includes(strength)
        )
      )
      .filter(strength => strength.toLowerCase().includes(skill.toLowerCase()));
  }

  private identifyAreasForImprovement(tests: any[], skill: string): string[] {
    // Find areas that need improvement for specific skill
    return tests
      .flatMap(test => this.extractKeyImprovements(test))
      .filter(improvement => 
        improvement.toLowerCase().includes(skill.toLowerCase())
      );
  }

  // Get user's writing test history
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Get total count
      const totalCount = await this.prisma.writingTest.count({
        where: { userId }
      });

      // Get paginated tests with evaluations
      const tests = await this.prisma.writingTest.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      });

      // Transform the data for response
      const formattedTests = tests.map(test => {
        const task1Feedback = test.task1Feedback ? JSON.parse(JSON.stringify(test.task1Feedback)) as TaskFeedback : null;
        const task2Feedback = test.task2Feedback ? JSON.parse(JSON.stringify(test.task2Feedback)) as TaskFeedback : null;

        return {
          testId: test.testSessionId,
          testType: test.testType,
          startedAt: test.createdAt,
          completedAt: test.updatedAt,
          status: test.status,
          task1: {
            prompt: test.task1Prompt,
            response: test.task1Response,
            evaluation: test.task1Band ? {
              band: test.task1Band,
              feedback: task1Feedback?.feedback,
              strengths: task1Feedback?.strengths || [],
              improvements: task1Feedback?.improvements || []
            } : null
          },
          task2: {
            prompt: test.task2Prompt,
            response: test.task2Response,
            evaluation: test.task2Band ? {
              band: test.task2Band,
              feedback: task2Feedback?.feedback,
              strengths: task2Feedback?.strengths || [],
              improvements: task2Feedback?.improvements || []
            } : null
          },
          overallBand: test.combinedBand || null
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          tests: formattedTests,
          pagination: {
            total: totalCount,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(totalCount / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Failed to get writing test history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get writing test history'
        }
      });
    }
  }
} 
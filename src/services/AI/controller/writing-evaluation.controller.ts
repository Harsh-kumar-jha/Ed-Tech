import { Request, Response } from 'express';
import { getPrisma } from '../../../db/database';
import { writingEvaluationConfig, WORD_COUNT_REQUIREMENTS, TIME_LIMITS } from '../config/writing-evaluation.config';
import { TokenService } from '../../Auth/services/token.service';
import { AIError } from '../../../utils/exceptions';
import { WritingCleanupService } from '../services/writing-cleanup.service';
import axios from 'axios';

export class WritingEvaluationController {
  private prisma = getPrisma();
  private tokenService = new TokenService();
  private cleanupService = new WritingCleanupService();

  async startWritingTest(req: Request, res: Response) {
    try {
      const { test_type } = req.body;
      const userId = req.user.id;

      // Get random Task 1 from templates
      const task1Template = await this.getRandomTask1Template(test_type);
      if (!task1Template) {
        return res.status(404).json({
          error: 'No Task 1 templates available',
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
      this.generateTask2Async(test.testSessionId, test_type);

      return res.status(200).json({
        testSessionId: test.testSessionId,
        task1Prompt: task1Template.prompt,
        task1ImageUrl: task1Template.imageUrl,
        timeLimit: 20 * 60, // 20 minutes in seconds
      });
    } catch (error) {
      console.error('Failed to start writing test:', error);
      return res.status(500).json({
        error: 'Failed to start writing test',
        status: 'failed',
      });
    }
  }

  private async getRandomTask1Template(testType: string) {
    // Get count of active templates
    const count = await this.prisma.writingTask1Template.count({
      where: {
        isActive: true,
      },
    });

    if (count === 0) return null;

    // Get random template
    const randomSkip = Math.floor(Math.random() * count);
    const [template] = await this.prisma.writingTask1Template.findMany({
      where: {
        isActive: true,
      },
      take: 1,
      skip: randomSkip,
    });

    return template;
  }

  private async generateTask2Async(testSessionId: string, testType: string) {
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

  private async generateTask1(testType: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
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
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new AIError('Failed to generate Task 1');
    }
  }

  private async generateTask2(testType: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
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
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new AIError('Failed to generate Task 2');
    }
  }

  private async evaluateWritingTask(data: any) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
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
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseAIResponse(response.data.choices[0].message.content);
    } catch (error) {
      throw new AIError('Failed to get AI evaluation');
    }
  }

  private parseAIResponse(content: string) {
    try {
      return JSON.parse(content);
    } catch (error) {
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
          combinedBand: this.calculateCombinedBand(evaluation.overall_band),
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
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
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
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return this.parseAIResponse(response.data.choices[0].message.content);
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
} 
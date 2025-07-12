import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReadingTestSessionService } from '../services/reading-test-session.service';
import { ReadingModuleService } from '../services/reading-module.service';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import Joi from 'joi';

export class ReadingTestSessionController {
  private sessionService: ReadingTestSessionService;
  private readingService: ReadingModuleService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.sessionService = new ReadingTestSessionService(this.prisma);
    this.readingService = new ReadingModuleService(this.prisma);
  }

  /**
   * Start a new reading test session
   * POST /api/ielts/reading/start-test
   */
  async startTest(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      // Get user and check restrictions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          readingAnalytics: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check test restrictions
      await this.checkUserTestRestrictions(user);

      // Get random test set for user
      const testSet = await this.readingService.getRandomTestSetForUser(userId);

      // Start test session
      const result = await this.sessionService.startTestSession(userId, testSet.id);

      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
      console.error('Start test error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * Mark test as started (when user actually begins)
   * POST /api/ielts/reading/begin-test/:attemptId
   */
  async beginTest(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const userId = req.user?.id;

      // Verify the attempt belongs to the user
      const attempt = await this.prisma.readingTestAttempt.findFirst({
        where: {
          id: attemptId,
          userId: userId,
        },
      });

      if (!attempt) {
        throw new AppError('Test attempt not found or unauthorized', HTTP_STATUS.NOT_FOUND);
      }

      const result = await this.sessionService.markTestAsStarted(attemptId, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Test started successfully',
        data: result,
      });
    } catch (error) {
      console.error('Begin test error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * Save answer for a question
   * POST /api/ielts/reading/save-answer
   */
  async saveAnswer(req: Request, res: Response) {
    try {
      const schema = Joi.object({
        attemptId: Joi.string().uuid().required(),
        questionId: Joi.string().uuid().required(),
        userAnswer: Joi.string().required(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        throw new AppError(`Validation error: ${error.details[0].message}`, HTTP_STATUS.BAD_REQUEST);
      }

      const { attemptId, questionId, userAnswer } = value;
      const userId = req.user?.id;

      // Verify the attempt belongs to the user
      const attempt = await this.prisma.readingTestAttempt.findFirst({
        where: {
          id: attemptId,
          userId: userId,
        },
      });

      if (!attempt) {
        throw new AppError('Test attempt not found or unauthorized', HTTP_STATUS.NOT_FOUND);
      }

      const result = await this.sessionService.saveAnswer(attemptId, questionId, userAnswer);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Answer saved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Save answer error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * Submit test and get results
   * POST /api/ielts/reading/submit-test/:attemptId
   */
  async submitTest(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const userId = req.user?.id;

      // Verify the attempt belongs to the user
      const attempt = await this.prisma.readingTestAttempt.findFirst({
        where: {
          id: attemptId,
          userId: userId,
        },
      });

      if (!attempt) {
        throw new AppError('Test attempt not found or unauthorized', HTTP_STATUS.NOT_FOUND);
      }

      const result = await this.sessionService.submitTest(attemptId);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      console.error('Submit test error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * Get test session status
   * GET /api/ielts/reading/session-status/:attemptId
   */
  async getSessionStatus(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const userId = req.user?.id;

      // Verify the attempt belongs to the user
      const attempt = await this.prisma.readingTestAttempt.findFirst({
        where: {
          id: attemptId,
          userId: userId,
        },
      });

      if (!attempt) {
        throw new AppError('Test attempt not found or unauthorized', HTTP_STATUS.NOT_FOUND);
      }

      const status = await this.sessionService.getTestSessionStatus(attemptId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Get session status error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  }

  /**
   * Get user's reading test history
   * GET /api/ielts/reading/my-tests
   */
  async getUserTestHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [tests, totalCount] = await Promise.all([
        this.prisma.readingTestResult.findMany({
          where: { userId },
          include: {
            testSet: {
              select: {
                id: true,
                testId: true,
                title: true,
                difficulty: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.readingTestResult.count({ where: { userId } }),
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Get user test history error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user's reading analytics
   * GET /api/ielts/reading/my-analytics
   */
  async getUserAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const analytics = await this.prisma.readingPerformanceAnalytics.findUnique({
        where: { userId },
      });

      // Get last 5 test results for trend analysis
      const recentTests = await this.prisma.readingTestResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          bandScore: true,
          createdAt: true,
          strengths: true,
          weaknesses: true,
        },
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          analytics,
          recentTests,
          canTakeTest: await this.canUserTakeTest(userId),
        },
      });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Check if user can take a test
   */
  private async canUserTakeTest(userId: string): Promise<{ canTake: boolean; reason?: string; nextAvailable?: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        readingAnalytics: true,
      },
    });

    if (!user) {
      return { canTake: false, reason: 'User not found' };
    }

    try {
      await this.checkUserTestRestrictions(user);
      return { canTake: true };
    } catch (error: any) {
      if (error.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
        return {
          canTake: false,
          reason: 'Cooldown period active',
          nextAvailable: user.readingAnalytics?.next24HourTest || undefined,
        };
      } else if (error.statusCode === HTTP_STATUS.FORBIDDEN) {
        return {
          canTake: false,
          reason: 'Test limit reached',
        };
      }
      return { canTake: false, reason: error.message };
    }
  }

  /**
   * Check user test restrictions based on subscription tier
   */
  private async checkUserTestRestrictions(user: any) {
    if (user.subscriptionTier === 'FREE') {
      // Free users: only 1 reading test allowed
      const testCount = await this.prisma.readingTestAttempt.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
        },
      });

      if (testCount >= 1) {
        throw new AppError(
          'Free users are limited to 1 Reading Module test. Please upgrade to Premium for unlimited tests.',
          HTTP_STATUS.FORBIDDEN
        );
      }
    } else if (user.subscriptionTier === 'PREMIUM') {
      // Premium users: 24-hour cooldown between tests
      if (user.readingAnalytics?.next24HourTest) {
        const now = new Date();
        const nextAllowedTest = new Date(user.readingAnalytics.next24HourTest);

        if (now < nextAllowedTest) {
          const hoursRemaining = Math.ceil((nextAllowedTest.getTime() - now.getTime()) / (1000 * 60 * 60));
          throw new AppError(
            `Please wait ${hoursRemaining} hours before taking another Reading Module test.`,
            HTTP_STATUS.TOO_MANY_REQUESTS
          );
        }
      }
    }
  }
}

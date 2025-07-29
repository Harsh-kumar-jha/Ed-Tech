import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ListeningSessionService } from '../services/listening-session.service';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { LISTENING_MESSAGES, LISTENING_ERRORS } from '../../../constants/listening-config';
import { ResponseService } from '../../../common/response.service';
import { ErrorService } from '../../../common/error.service';
import Joi from 'joi';

export class ListeningSessionController {
  private sessionService: ListeningSessionService;
  private responseService: ResponseService;
  private errorService: ErrorService;

  constructor() {
    this.sessionService = new ListeningSessionService();
    this.responseService = new ResponseService();
    this.errorService = new ErrorService();
  }

  /**
   * Start a new listening test session
   */
  async startTest(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = this.validateStartTestRequest(req.body);
      if (validationResult.error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error(validationResult.error.details[0].message, 'VALIDATION_ERROR')
        );
        return;
      }

      const { testId } = req.body;
      const userId = req.user!.id;

      const result = await this.sessionService.startTest(userId, testId);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'startListeningTest', 
        userId: req.user?.id,
        testId: req.body.testId 
      });
    }
  }

  /**
   * Get active listening session for user
   */
  async getActiveSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const session = await this.sessionService.getActiveSession(userId);

      if (!session) {
        res.status(HTTP_STATUS.NOT_FOUND).json(
          this.responseService.error(LISTENING_ERRORS.SESSION_NOT_ACTIVE, 'NO_ACTIVE_SESSION')
        );
        return;
      }

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(session, 'Active session retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'getActiveListeningSession', 
        userId: req.user?.id 
      });
    }
  }

  /**
   * Update progress of current session
   */
  async updateProgress(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = this.validateUpdateProgressRequest(req.body);
      if (validationResult.error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error(validationResult.error.details[0].message, 'VALIDATION_ERROR')
        );
        return;
      }

      const { attemptId } = req.params;
      const updatedSession = await this.sessionService.updateProgress(attemptId, req.body);

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(updatedSession, 'Progress updated successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'updateListeningProgress', 
        userId: req.user?.id,
        attemptId: req.params.attemptId 
      });
    }
  }

  /**
   * Submit answers and complete test
   */
  async submitAnswers(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = this.validateSubmitAnswersRequest(req.body);
      if (validationResult.error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error(validationResult.error.details[0].message, 'VALIDATION_ERROR')
        );
        return;
      }

      const result = await this.sessionService.submitAnswers(req.body);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'submitListeningAnswers', 
        userId: req.user?.id,
        attemptId: req.body.attemptId 
      });
    }
  }

  /**
   * Abandon current session
   */
  async abandonSession(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      
      const success = await this.sessionService.abandonSession(attemptId);

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(
          { abandoned: success }, 
          'Session abandoned successfully'
        )
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'abandonListeningSession', 
        userId: req.user?.id,
        attemptId: req.params.attemptId 
      });
    }
  }

  /**
   * Get session statistics and progress
   */
  async getSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      
      const stats = await this.sessionService.getSessionStats(attemptId);

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(stats, 'Session statistics retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'getListeningSessionStats', 
        userId: req.user?.id,
        attemptId: req.params.attemptId 
      });
    }
  }

  /**
   * Get user's listening test history
   */
  async getTestHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const prisma = new PrismaClient();
      
      const [attempts, total] = await Promise.all([
        prisma.listeningTestAttempt.findMany({
          where: { 
            userId,
            status: 'COMPLETED'
          },
          include: {
            test: {
              select: {
                testId: true,
                title: true,
                difficulty: true,
                totalQuestions: true
              }
            },
            result: {
              select: {
                bandScore: true,
                percentage: true,
                correctAnswers: true,
                wrongAnswers: true,
                timeSpent: true,
                audioTimeSpent: true,
                audioUtilization: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          skip,
          take: limitNumber
        }),
        prisma.listeningTestAttempt.count({
          where: {
            userId,
            status: 'COMPLETED'
          }
        })
      ]);

      const history = {
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          test: attempt.test,
          status: attempt.status,
          score: attempt.score,
          bandScore: attempt.bandScore,
          percentage: attempt.percentage,
          timeSpent: attempt.timeSpent,
          completedAt: attempt.completedAt,
          result: attempt.result
        })),
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber)
        }
      };

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(history, 'Test history retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'getListeningTestHistory', 
        userId: req.user?.id 
      });
    }
  }

  /**
   * Get user's listening performance analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const prisma = new PrismaClient();

      const [analytics, recentTests] = await Promise.all([
        prisma.listeningPerformanceAnalytics.findUnique({
          where: { userId }
        }),
        prisma.listeningTestResult.findMany({
          where: { userId },
          include: {
            test: {
              select: {
                testId: true,
                title: true,
                difficulty: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        })
      ]);

      // Generate progress chart data
      const progressChart = {
        labels: recentTests.map((_, index) => `Test ${recentTests.length - index}`),
        bandScores: recentTests.reverse().map(test => test.bandScore),
        dates: recentTests.map(test => test.createdAt.toISOString().split('T')[0])
      };

      const response = {
        analytics: analytics || {
          totalTests: 0,
          averageBandScore: 0,
          bestBandScore: 0,
          latestBandScore: 0
        },
        recentTests,
        progressChart
      };

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(response, 'Analytics retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { 
        action: 'getListeningAnalytics', 
        userId: req.user?.id 
      });
    }
  }

  // Private validation methods

  private validateStartTestRequest(data: any) {
    const schema = Joi.object({
      testId: Joi.string().required()
    });

    return schema.validate(data);
  }

  private validateUpdateProgressRequest(data: any) {
    const schema = Joi.object({
      currentSection: Joi.number().min(1).max(4).optional(),
      audioStartedAt: Joi.date().optional(),
      audioTimeSpent: Joi.number().min(0).optional(),
      timeSpent: Joi.number().min(0).optional(),
      audioCompleted: Joi.boolean().optional(),
      warningShown: Joi.boolean().optional()
    });

    return schema.validate(data);
  }

  private validateSubmitAnswersRequest(data: any) {
    const schema = Joi.object({
      attemptId: Joi.string().required(),
      answers: Joi.array().items(
        Joi.object({
          questionId: Joi.string().required(),
          questionNumber: Joi.number().min(1).max(40).required(),
          userAnswer: Joi.string().allow('').required(),
          timeSpent: Joi.number().min(0).optional()
        })
      ).min(1).required()
    });

    return schema.validate(data);
  }
} 
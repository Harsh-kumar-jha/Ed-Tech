import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ListeningTestService } from '../services/listening-test.service';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { LISTENING_MESSAGES, LISTENING_ERRORS } from '../../../constants/listening-config';
import { ResponseService } from '../../../common/response.service';
import { ErrorService } from '../../../common/error.service';
import Joi from 'joi';

export class ListeningTestController {
  private listeningService: ListeningTestService;
  private prisma: PrismaClient;
  private responseService: ResponseService;
  private errorService: ErrorService;

  constructor() {
    this.prisma = new PrismaClient();
    this.listeningService = new ListeningTestService(this.prisma);
    this.responseService = new ResponseService();
    this.errorService = new ErrorService();
  }

  /**
   * Create a new listening test (Admin only)
   */
  async createTest(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = this.validateCreateTestRequest(req.body);
      if (validationResult.error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error(validationResult.error.details[0].message, 'VALIDATION_ERROR')
        );
        return;
      }

      const test = await this.listeningService.createTest(req.body, req.user!.id);

      res.status(HTTP_STATUS.CREATED).json(
        this.responseService.success(test, 'Listening test created successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'createListeningTest' });
    }
  }

  /**
   * Upload audio file for a test (Admin only)
   */
  async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      
      if (!req.file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error('Audio file is required', 'FILE_REQUIRED')
        );
        return;
      }

      const result = await this.listeningService.uploadAudio(req.file, testId);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'uploadAudio', testId: req.params.testId });
    }
  }

  /**
   * Get all listening tests with pagination and filtering (Admin only)
   */
  async getTests(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        difficulty,
        isActive
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      const result = await this.listeningService.getTests(
        pageNumber,
        limitNumber,
        difficulty as any,
        isActive !== undefined ? isActive === 'true' : undefined
      );

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(result, 'Listening tests retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'getListeningTests' });
    }
  }

  /**
   * Get single listening test by ID (Admin only)
   */
  async getTestById(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      const test = await this.listeningService.getTestById(testId);

      if (!test) {
        res.status(HTTP_STATUS.NOT_FOUND).json(
          this.responseService.error(LISTENING_ERRORS.INVALID_TEST_ID, 'NOT_FOUND')
        );
        return;
      }

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(test, 'Listening test retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'getListeningTestById', testId: req.params.testId });
    }
  }

  /**
   * Update listening test (Admin only)
   */
  async updateTest(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      const validationResult = this.validateUpdateTestRequest(req.body);
      
      if (validationResult.error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(
          this.responseService.error(validationResult.error.details[0].message, 'VALIDATION_ERROR')
        );
        return;
      }

      const test = await this.listeningService.updateTest(testId, req.body);

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(test, 'Listening test updated successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'updateListeningTest', testId: req.params.testId });
    }
  }

  /**
   * Delete listening test (Admin only)
   */
  async deleteTest(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      
      await this.listeningService.deleteTest(testId);

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(null, 'Listening test deleted successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'deleteListeningTest', testId: req.params.testId });
    }
  }

  /**
   * Get active listening tests for students
   */
  async getActiveTests(req: Request, res: Response): Promise<void> {
    try {
      const tests = await this.listeningService.getActiveTests();

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(tests, 'Active listening tests retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'getActiveListeningTests' });
    }
  }

  /**
   * Get listening test statistics (Admin only)
   */
  async getTestStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;

      const [test, attempts, avgScore] = await Promise.all([
        this.prisma.listeningTest.findUnique({
          where: { testId },
          include: { _count: { select: { attempts: true } } }
        }),
        this.prisma.listeningTestAttempt.findMany({
          where: { test: { testId } },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
        }),
        this.prisma.listeningTestAttempt.aggregate({
          where: { test: { testId }, status: 'COMPLETED' },
          _avg: { bandScore: true, score: true }
        })
      ]);

      if (!test) {
        res.status(HTTP_STATUS.NOT_FOUND).json(
          this.responseService.error(LISTENING_ERRORS.INVALID_TEST_ID, 'NOT_FOUND')
        );
        return;
      }

      const statistics = {
        test: {
          id: test.id,
          testId: test.testId,
          title: test.title,
          difficulty: test.difficulty,
          totalQuestions: test.totalQuestions,
          isActive: test.isActive
        },
        attempts: {
          total: test._count.attempts,
          completed: attempts.filter(a => a.status === 'COMPLETED').length,
          inProgress: attempts.filter(a => a.status === 'IN_PROGRESS').length,
          expired: attempts.filter(a => a.status === 'EXPIRED').length
        },
        performance: {
          averageBandScore: avgScore._avg.bandScore || 0,
          averageScore: avgScore._avg.score || 0,
          averagePercentage: avgScore._avg.score ? (avgScore._avg.score / test.totalQuestions) * 100 : 0
        },
        recentAttempts: attempts
          .filter(a => a.status === 'COMPLETED')
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
          .slice(0, 10)
          .map(attempt => ({
            id: attempt.id,
            user: attempt.user,
            score: attempt.score,
            bandScore: attempt.bandScore,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt
          }))
      };

      res.status(HTTP_STATUS.OK).json(
        this.responseService.success(statistics, 'Test statistics retrieved successfully')
      );
    } catch (error: any) {
      this.errorService.handleError(error, res, { action: 'getTestStatistics', testId: req.params.testId });
    }
  }

  // Private validation methods

  private validateCreateTestRequest(data: any) {
    const schema = Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional(),
      difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
      sections: Joi.array().items(
        Joi.object({
          sectionNumber: Joi.number().min(1).max(4).required(),
          title: Joi.string().min(3).max(100).required(),
          description: Joi.string().max(500).optional(),
          type: Joi.string().valid('SOCIAL_SURVIVAL', 'EDUCATIONAL_TRAINING').required(),
          audioStartTime: Joi.number().min(0).optional(),
          audioEndTime: Joi.number().min(0).optional(),
          instructions: Joi.string().max(1000).optional(),
          questions: Joi.array().items(
            Joi.object({
              questionNumber: Joi.number().min(1).max(40).required(),
              questionType: Joi.string().required(),
              questionText: Joi.string().min(5).required(),
              options: Joi.array().items(Joi.string()).optional(),
              correctAnswer: Joi.string().required(),
              acceptableAnswers: Joi.array().items(Joi.string()).optional(),
              caseSensitive: Joi.boolean().optional(),
              points: Joi.number().min(0).max(10).optional(),
              audioTimestamp: Joi.number().min(0).optional(),
              hints: Joi.array().items(Joi.string()).optional()
            })
          ).length(10).required()
        })
      ).length(4).required()
    });

    return schema.validate(data);
  }

  private validateUpdateTestRequest(data: any) {
    const schema = Joi.object({
      title: Joi.string().min(3).max(200).optional(),
      description: Joi.string().max(1000).optional(),
      difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
      isActive: Joi.boolean().optional()
    });

    return schema.validate(data);
  }
} 
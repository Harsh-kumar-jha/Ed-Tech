import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReadingModuleService } from '../services/reading-module.service';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import Joi from 'joi';

export class ReadingModuleController {
  private readingService: ReadingModuleService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.readingService = new ReadingModuleService(this.prisma);
  }

  /**
   * Bulk upload reading test sets from JSON
   * POST /api/ielts/reading/admin/bulk-upload
   */
  async bulkUploadTestSets(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      // Validate request body
      const schema = Joi.array()
        .items(
          Joi.object().pattern(
            Joi.string(),
            Joi.object({
              passage_1: Joi.object({
                title: Joi.string().required(),
                text: Joi.string().required(),
              }).required(),
              passage_2: Joi.object({
                title: Joi.string().required(),
                text: Joi.string().required(),
              }).required(),
              passage_3: Joi.object({
                title: Joi.string().required(),
                text: Joi.string().required(),
              }).required(),
              passage_1_questions: Joi.object().required(),
              passage_2_questions: Joi.object().required(),
              passage_3_questions: Joi.object().required(),
              all_answers: Joi.object().optional(),
            })
          )
        )
        .min(1);

      const { error, value } = schema.validate(req.body);
      if (error) {
        throw new AppError(`Validation error: ${error.details[0].message}`, HTTP_STATUS.BAD_REQUEST);
      }

      // Upload test sets
      const result = await this.readingService.bulkUploadTestSets(value, req.user.id);

      // Process answers if available
      await this.readingService.processAnswersFromBulkUpload(value);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
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
   * Get all reading test sets with pagination
   * GET /api/ielts/reading/admin/test-sets
   */
  async getReadingTestSets(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        difficulty: req.query.difficulty,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      };

      const result = await this.readingService.getReadingTestSets(page, limit, filters);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.testSets,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get test sets error:', error);
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
   * Get specific reading test set by ID
   * GET /api/ielts/reading/admin/test-sets/:id
   */
  async getReadingTestSetById(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      const { id } = req.params;
      const testSet = await this.readingService.getReadingTestSetById(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: testSet,
      });
    } catch (error) {
      console.error('Get test set by ID error:', error);
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
   * Update reading test set
   * PUT /api/ielts/reading/admin/test-sets/:id
   */
  async updateReadingTestSet(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      const { id } = req.params;

      // Validate request body
      const schema = Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
        isActive: Joi.boolean().optional(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        throw new AppError(`Validation error: ${error.details[0].message}`, HTTP_STATUS.BAD_REQUEST);
      }

      const testSet = await this.readingService.updateReadingTestSet(id, value);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reading test set updated successfully',
        data: testSet,
      });
    } catch (error) {
      console.error('Update test set error:', error);
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
   * Delete reading test set
   * DELETE /api/ielts/reading/admin/test-sets/:id
   */
  async deleteReadingTestSet(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      const { id } = req.params;
      const result = await this.readingService.deleteReadingTestSet(id);

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      console.error('Delete test set error:', error);
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
   * Get random test set for user (student endpoint)
   * GET /api/ielts/reading/get-test-set
   */
  async getRandomTestSetForUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check user subscription and test limits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          readingAnalytics: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check test restrictions based on subscription
      await this.checkUserTestRestrictions(user);

      const testSet = await this.readingService.getRandomTestSetForUser(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: testSet,
      });
    } catch (error) {
      console.error('Get random test set error:', error);
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

  /**
   * Get test statistics (admin endpoint)
   * GET /api/ielts/reading/admin/statistics
   */
  async getTestStatistics(req: Request, res: Response) {
    try {
      // Validate admin permissions
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        throw new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN);
      }

      const [totalTestSets, activeTestSets, totalAttempts, completedAttempts, averageBandScore] = await Promise.all([
        this.prisma.readingTestSet.count(),
        this.prisma.readingTestSet.count({ where: { isActive: true } }),
        this.prisma.readingTestAttempt.count(),
        this.prisma.readingTestAttempt.count({ where: { status: 'COMPLETED' } }),
        this.prisma.readingTestResult.aggregate({
          _avg: { bandScore: true },
        }),
      ]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          totalTestSets,
          activeTestSets,
          totalAttempts,
          completedAttempts,
          averageBandScore: averageBandScore._avg.bandScore || 0,
        },
      });
    } catch (error) {
      console.error('Get statistics error:', error);
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
}

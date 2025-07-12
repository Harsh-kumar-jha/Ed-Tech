import { Request, Response } from 'express';
import { GlobalTestSessionService } from '../services/global-test-session.service';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants';

export class GlobalTestSessionController {
  private globalSessionService: GlobalTestSessionService;

  constructor() {
    this.globalSessionService = new GlobalTestSessionService();
  }

  /**
   * Get user's active test session (if any) across all modules
   * GET /api/v1/test-session/active
   */
  async getActiveSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      const activeSession = await this.globalSessionService.getActiveSessionDetails(userId);

      if (!activeSession) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            hasActiveSession: false,
            activeSession: null,
          },
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          hasActiveSession: true,
          activeSession: {
            id: activeSession.id,
            module: activeSession.module,
            moduleTestId: activeSession.moduleTestId,
            moduleAttemptId: activeSession.moduleAttemptId,
            status: activeSession.status,
            startedAt: activeSession.startedAt,
            timeRemaining: activeSession.timeRemaining,
            isExpired: activeSession.isExpired,
            expiresAt: activeSession.expiresAt,
          },
        },
      });
    } catch (error) {
      console.error('Get active session error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Abandon current active test session
   * POST /api/v1/test-session/abandon
   */
  async abandonActiveSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      const activeSession = await this.globalSessionService.getActiveSessionDetails(userId);

      if (!activeSession) {
        throw new AppError('No active test session found', HTTP_STATUS.NOT_FOUND);
      }

      await this.globalSessionService.abandonTestSession(userId, activeSession.moduleAttemptId);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Active ${activeSession.module.toLowerCase()} test session has been abandoned`,
        data: {
          abandonedModule: activeSession.module,
          abandonedAttemptId: activeSession.moduleAttemptId,
        },
      });
    } catch (error) {
      console.error('Abandon session error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user's test session history across all modules
   * GET /api/v1/test-session/history
   */
  async getSessionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        throw new AppError('User not authenticated', HTTP_STATUS.UNAUTHORIZED);
      }

      const result = await this.globalSessionService.getUserSessionHistory(userId, page, limit);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get session history error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Clean up expired sessions (admin only)
   * POST /api/v1/test-session/cleanup-expired
   */
  async cleanupExpiredSessions(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AppError('Admin privileges required', HTTP_STATUS.FORBIDDEN);
      }

      const result = await this.globalSessionService.cleanupExpiredSessions();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Expired sessions cleaned up successfully',
        data: {
          cleanedSessions: result.count,
        },
      });
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

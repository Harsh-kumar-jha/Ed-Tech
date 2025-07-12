import { PrismaClient, IELTSModule, TestStatus } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants';

export class GlobalTestSessionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if user has an active test session in any module
   */
  async checkActiveSession(userId: string) {
    const activeSession = await this.prisma.globalTestSession.findFirst({
      where: {
        userId,
        isActive: true,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS'],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return activeSession;
  }

  /**
   * Create a new global test session
   */
  async createTestSession(
    userId: string,
    module: IELTSModule,
    moduleTestId: string,
    moduleAttemptId: string,
    timeLimit: number
  ) {
    // First check if user already has an active session
    const existingSession = await this.checkActiveSession(userId);

    if (existingSession) {
      throw new AppError(
        `You already have an active ${existingSession.module.toLowerCase()} test session. Please complete or abandon your current test before starting a new one.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Create new global test session
    const expiresAt = new Date(Date.now() + timeLimit * 1000);

    const globalSession = await this.prisma.globalTestSession.create({
      data: {
        userId,
        module,
        moduleTestId,
        moduleAttemptId,
        timeLimit,
        expiresAt,
        isActive: true,
        status: 'NOT_STARTED',
      },
    });

    return globalSession;
  }

  /**
   * Update global test session status
   */
  async updateSessionStatus(userId: string, moduleAttemptId: string, status: TestStatus, isActive?: boolean) {
    const updateData: any = {
      status,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedSession = await this.prisma.globalTestSession.updateMany({
      where: {
        userId,
        moduleAttemptId,
        isActive: true,
      },
      data: updateData,
    });

    return updatedSession;
  }

  /**
   * Complete/End a test session
   */
  async completeTestSession(userId: string, moduleAttemptId: string) {
    const completedSession = await this.prisma.globalTestSession.updateMany({
      where: {
        userId,
        moduleAttemptId,
        isActive: true,
      },
      data: {
        status: 'COMPLETED',
        isActive: false,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return completedSession;
  }

  /**
   * Abandon/Cancel a test session
   */
  async abandonTestSession(userId: string, moduleAttemptId: string) {
    const abandonedSession = await this.prisma.globalTestSession.updateMany({
      where: {
        userId,
        moduleAttemptId,
        isActive: true,
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return abandonedSession;
  }

  /**
   * Get active session details for a user
   */
  async getActiveSessionDetails(userId: string) {
    const activeSession = await this.prisma.globalTestSession.findFirst({
      where: {
        userId,
        isActive: true,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS'],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!activeSession) {
      return null;
    }

    // Calculate remaining time
    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((activeSession.expiresAt.getTime() - now.getTime()) / 1000));

    return {
      ...activeSession,
      timeRemaining,
      isExpired: timeRemaining === 0,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const expiredSessions = await this.prisma.globalTestSession.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return expiredSessions;
  }

  /**
   * Get user's test session history
   */
  async getUserSessionHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [sessions, totalCount] = await Promise.all([
      this.prisma.globalTestSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          module: true,
          status: true,
          startedAt: true,
          lastActivityAt: true,
          timeLimit: true,
          createdAt: true,
        },
      }),
      this.prisma.globalTestSession.count({
        where: { userId },
      }),
    ]);

    return {
      sessions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Force end all active sessions for a user (admin function)
   */
  async forceEndAllUserSessions(userId: string, reason: string = 'Administrative action') {
    const endedSessions = await this.prisma.globalTestSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return endedSessions;
  }
}

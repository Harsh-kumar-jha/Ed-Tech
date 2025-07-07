import { getPrisma } from '../../../db/database';
import { logError, logInfo } from '../../../utils/logger';

export class TestQuotaService {
  private static instance: TestQuotaService;
  private prisma = getPrisma();
  private readonly MAX_FREE_TESTS = 5;

  private constructor() {}

  public static getInstance(): TestQuotaService {
    if (!TestQuotaService.instance) {
      TestQuotaService.instance = new TestQuotaService();
    }
    return TestQuotaService.instance;
  }

  public async checkQuota(userId: string): Promise<{ 
    hasQuota: boolean; 
    remainingTests: number;
    totalTests: number;
  }> {
    try {
      // Get completed tests count
      const completedTests = await this.prisma.writingTest.count({
        where: {
          userId,
          status: 'evaluated',
        },
      });

      const remainingTests = Math.max(0, this.MAX_FREE_TESTS - completedTests);
      
      return {
        hasQuota: completedTests < this.MAX_FREE_TESTS,
        remainingTests,
        totalTests: completedTests
      };
    } catch (error) {
      logError('Error checking test quota', error);
      throw new Error('Failed to check test quota');
    }
  }

  public async incrementTestCount(userId: string): Promise<void> {
    try {
      // This is just for tracking purposes since we already check quota before starting a test
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          testCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      logError('Error incrementing test count', error);
      // Don't throw error here as this is not critical
    }
  }

  public async getQuotaStatus(userId: string): Promise<{
    hasQuota: boolean;
    remainingTests: number;
    totalTests: number;
    quotaResetDate?: Date;
    isSubscribed: boolean;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          testCount: true,
          subscriptionStatus: true,
          subscriptionEndDate: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isSubscribed = user.subscriptionStatus === 'active' && 
                          user.subscriptionEndDate && 
                          user.subscriptionEndDate > new Date();

      // If user is subscribed, they have unlimited quota
      if (isSubscribed) {
        return {
          hasQuota: true,
          remainingTests: -1, // -1 indicates unlimited
          totalTests: user.testCount || 0,
          isSubscribed: true
        };
      }

      // For free users, check their quota
      const { hasQuota, remainingTests, totalTests } = await this.checkQuota(userId);

      return {
        hasQuota,
        remainingTests,
        totalTests,
        quotaResetDate: undefined, // Implement if you want to reset quota periodically
        isSubscribed: false
      };
    } catch (error) {
      logError('Error getting quota status', error);
      throw new Error('Failed to get quota status');
    }
  }
} 
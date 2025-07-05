import { getPrisma } from '../../../db/database';
import { logError, logInfo } from '../../../utils/logger';

export class WritingCleanupService {
  private prisma = getPrisma();

  /**
   * Schedule cleanup of questions and responses after 24 hours
   */
  async scheduleCleanup(testSessionId: string): Promise<void> {
    try {
      const deleteTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      await this.prisma.writingTest.update({
        where: { testSessionId },
        data: { deleteQuestionsAt: deleteTime }
      });
    } catch (error) {
      logError('Failed to schedule cleanup', error);
    }
  }

  /**
   * Run cleanup for all tests that are past their deletion time
   */
  async runCleanup(): Promise<void> {
    try {
      const now = new Date();
      const testsToClean = await this.prisma.writingTest.findMany({
        where: {
          deleteQuestionsAt: {
            lte: now,
          },
          OR: [
            { task1Prompt: { not: null } },
            { task2Prompt: { not: null } },
            { task1Response: { not: null } },
            { task2Response: { not: null } },
          ],
        },
      });

      for (const test of testsToClean) {
        await this.prisma.writingTest.update({
          where: { id: test.id },
          data: {
            task1Prompt: null,
            task2Prompt: null,
            task1Response: null,
            task2Response: null,
            deleteQuestionsAt: null,
          },
        });
        logInfo(`Cleaned up test data for session ${test.testSessionId}`);
      }
    } catch (error) {
      logError('Failed to run cleanup', error);
    }
  }
} 
/**
 * Cleanup Jobs Utility
 * Handles periodic database cleanup tasks
 */

import { AuthModel } from '../models/Auth.model';
import { logInfo, logError } from './logger';

class CleanupJobs {
  private authModel: AuthModel | null = null;

  /**
   * Initialize AuthModel only when needed (lazy initialization)
   */
  private getAuthModel(): AuthModel {
    if (!this.authModel) {
      this.authModel = new AuthModel();
    }
    return this.authModel;
  }

  /**
   * Run OTP cleanup job
   * Removes expired and used OTP records older than 24 hours
   */
  async runOTPCleanup(): Promise<void> {
    try {
      logInfo('Starting OTP cleanup job');
      
      const authModel = this.getAuthModel();
      const result = await authModel.cleanupExpiredOTPs();
      
      if (result.success) {
        logInfo('OTP cleanup job completed successfully', {
          deletedRecords: result.data?.deletedCount || 0
        });
      } else {
        logError('OTP cleanup job failed', new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      logError('OTP cleanup job encountered an error', error);
    }
  }

  /**
   * Run all cleanup jobs
   */
  async runAllCleanupJobs(): Promise<void> {
    await this.runOTPCleanup();
    // Add more cleanup jobs here as needed
    // await this.runSessionCleanup();
    // await this.runAuditLogCleanup();
  }

  /**
   * Schedule periodic cleanup (example using setTimeout - in production use cron)
   * @param intervalHours How often to run cleanup (in hours)
   */
  startPeriodicCleanup(intervalHours: number = 24): void {
    const intervalMs = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    logInfo('Starting periodic cleanup scheduler', {
      intervalHours,
      nextRunAt: new Date(Date.now() + intervalMs).toISOString()
    });

    // Don't run cleanup immediately - wait for server to be fully initialized
    // Schedule cleanup to start after a brief delay
    setTimeout(() => {
      this.runAllCleanupJobs();
    }, 10000); // Wait 10 seconds for server to fully start

    // Schedule recurring cleanup
    setInterval(() => {
      this.runAllCleanupJobs();
    }, intervalMs);
  }
}

export const cleanupJobs = new CleanupJobs();

// Example usage:
// import { cleanupJobs } from './utils/cleanup-jobs';
// cleanupJobs.startPeriodicCleanup(24); // Run every 24 hours 
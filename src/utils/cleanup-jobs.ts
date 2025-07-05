/**
 * Cleanup Jobs Utility
 * Handles periodic database cleanup tasks
 */

import { AuthModel } from '../models/Auth.model';
import { logInfo, logError } from './logger';
import { checkDatabaseHealth } from './database';
import { CronJob } from 'cron';
import { WritingCleanupService } from '../services/AI/services/writing-cleanup.service';

class CleanupJobs {
  private authModel: AuthModel | null = null;
  private otpCleanupJob: CronJob | null = null;

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
   * Check if database is available before running cleanup jobs
   */
  private async isDatabaseAvailable(): Promise<boolean> {
    try {
      return await checkDatabaseHealth();
    } catch (error) {
      logError('Database health check failed in cleanup jobs', error);
      return false;
    }
  }

  /**
   * Run OTP cleanup job
   * Removes expired and used OTP records older than 24 hours
   */
  async runOTPCleanup(): Promise<void> {
    try {
      logInfo('Starting OTP cleanup job');

      // Check database availability first
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logInfo('Skipping OTP cleanup - database not available');
        return;
      }
      
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
      // Catch and log errors instead of letting them crash the app
      logError('Failed to cleanup expired OTPs', error);
      // Don't throw - just log and continue
    }
  }

  /**
   * Run all cleanup jobs
   */
  async runAllCleanupJobs(): Promise<void> {
    try {
      logInfo('Starting all cleanup jobs');
      
      // Run OTP cleanup with error handling
      await this.runOTPCleanup();
      
      // Add more cleanup jobs here as needed
      // await this.runSessionCleanup();
      // await this.runAuditLogCleanup();
      
      logInfo('All cleanup jobs completed');
    } catch (error) {
      // Ensure cleanup job failures don't crash the application
      logError('Error during cleanup jobs execution', error);
    }
  }

  /**
   * Schedule periodic cleanup using cron
   * @param cronPattern Cron pattern for scheduling (defaults to every 24 hours at midnight)
   */
  startPeriodicCleanup(cronPattern: string = '0 0 * * *'): void {
    // Stop existing job if any
    if (this.otpCleanupJob) {
      this.otpCleanupJob.stop();
    }

    logInfo('Starting periodic cleanup scheduler', {
      cronPattern,
      nextRunAt: new CronJob(
        cronPattern,
        () => {},
        null,
        false,
        'UTC'
      ).nextDate().toString()
    });

    // Create new cron job
    this.otpCleanupJob = new CronJob(
      cronPattern,
      () => {
        this.runAllCleanupJobs().catch((error) => {
          logError('Error in periodic cleanup job execution', error);
        });
      },
      null, // onComplete
      true, // start
      'UTC' // timeZone
    );

    // Run initial cleanup after 30 seconds
    setTimeout(() => {
      this.runAllCleanupJobs().catch((error) => {
        logError('Error in initial cleanup job execution', error);
      });
    }, 30000);
  }
}

export const cleanupJobs = new CleanupJobs();

// Run writing cleanup job every hour
export const writingCleanupJob = new CronJob(
  '0 * * * *',
  async () => {
    const cleanupService = new WritingCleanupService();
    try {
      await cleanupService.runCleanup();
      logInfo('Writing test cleanup completed successfully');
    } catch (error) {
      logError('Writing test cleanup failed:', error);
    }
  },
  null, // onComplete
  true, // start
  'UTC' // timeZone
);

// Example usage:
// import { cleanupJobs } from './utils/cleanup-jobs';
// cleanupJobs.startPeriodicCleanup(24); // Run every 24 hours 
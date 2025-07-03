/**
 * Cleanup Jobs Utility
 * Handles periodic database cleanup tasks
 */

import { AuthModel } from '../models/Auth.model';
import { logInfo, logError } from './logger';
import { checkDatabaseHealth } from './database';

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
      this.runAllCleanupJobs().catch((error) => {
        logError('Error in initial cleanup job execution', error);
      });
    }, 30000); // Wait 30 seconds for server to fully start and database to be ready

    // Schedule recurring cleanup with error handling
    setInterval(() => {
      this.runAllCleanupJobs().catch((error) => {
        logError('Error in periodic cleanup job execution', error);
      });
    }, intervalMs);
  }
}

export const cleanupJobs = new CleanupJobs();

// Example usage:
// import { cleanupJobs } from './utils/cleanup-jobs';
// cleanupJobs.startPeriodicCleanup(24); // Run every 24 hours 
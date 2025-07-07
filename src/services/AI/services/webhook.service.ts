import axios from 'axios';
import { getPrisma } from '../../../db/database';
import { webhookConfig } from '../config/writing-evaluation.config';
import logger from '../../../utils/logger';

export class WebhookService {
  private prisma = getPrisma();
  private static instance: WebhookService;

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Send webhook notification with retry mechanism
   */
  async sendWebhook(userId: string, event: string, payload: any): Promise<boolean> {
    try {
      // Get user's webhook configuration
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          profile: {
            select: {
              webhookUrl: true,
              webhookSecret: true
            }
          }
        }
      });

      if (!user?.profile?.webhookUrl) {
        return false; // No webhook URL configured
      }

      // Check if user has webhook access
      if (user.subscriptionTier !== 'PREMIUM' || user.subscriptionStatus !== 'active') {
        return false; // Only active premium users get webhooks
      }

      const webhookData = {
        event,
        timestamp: new Date().toISOString(),
        userId: user.id,
        data: payload
      };

      // Add signature if secret is configured
      if (user.profile.webhookSecret) {
        webhookData['signature'] = this.generateSignature(webhookData, user.profile.webhookSecret);
      }

      // Try to send webhook with retries
      for (let attempt = 1; attempt <= webhookConfig.retryAttempts; attempt++) {
        try {
          await axios.post(user.profile.webhookUrl, webhookData, {
            timeout: webhookConfig.timeout,
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Event': event,
              'X-Attempt': attempt.toString()
            }
          });
          
          // Log successful webhook
          await this.logWebhook(userId, event, true);
          return true;
        } catch (error) {
          logger.error(`Webhook attempt ${attempt} failed:`, error);
          if (attempt < webhookConfig.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, webhookConfig.retryDelay));
          }
        }
      }

      // Log failed webhook after all retries
      await this.logWebhook(userId, event, false);
      return false;
    } catch (error) {
      logger.error('Error in webhook service:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Log webhook attempt
   */
  private async logWebhook(userId: string, event: string, success: boolean) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          userId,
          event,
          success,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log webhook:', error);
    }
  }
} 
import { UserRole } from '../types';
import { SubscriptionTier } from './user.interface';

export interface JWTPayload {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  premiumTestCount: number;
  provider: string;
}

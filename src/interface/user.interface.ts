/**
 * User domain interfaces
 */

import { BaseEntity } from './base.interface';
import { UserRole, DifficultyLevel } from '../types';

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export interface IUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  phoneNumber?: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  provider: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  subscriptionEndDate?: Date;
  subscriptionFeatures: string[];
  testCount: number;
  premiumTestCount: number;
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  microsoftId?: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile | null;
  googleId?: string;
  microsoftId?: string;
  provider?: string;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  dateOfBirth?: Date;
  phone?: string;
  country?: string;
  language?: string;
  timezone?: string;
  avatar?: string;
  bio?: string;
  targetScore?: number;
  currentLevel?: DifficultyLevel;
  studyGoals?: string[];
}

export interface AuthenticatedRequest {
  user: User;
} 
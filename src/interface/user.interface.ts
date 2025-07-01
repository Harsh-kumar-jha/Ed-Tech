/**
 * User domain interfaces
 */

import { BaseEntity } from './base.interface';
import { UserRole, DifficultyLevel } from '../types';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
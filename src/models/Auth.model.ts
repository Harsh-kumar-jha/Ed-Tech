/**
 * Auth Model
 * Handles user authentication and authorization data operations
 */

import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../utils/database';
import { hashPassword, comparePassword } from '../services/Auth/utils/auth';
import { 
  CreateUserRequest, 
  LoginRequest, 
  ServiceResponse, 
  User,
  UserWithoutPassword,
  UserRole 
} from '../types';
import { logInfo, logError } from '../utils/logger';
import { ConflictError, AuthError, DatabaseError } from '../utils/exceptions';

export class AuthModel {
  private db = getPrismaClient();

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      // Check if user already exists
      const existingUser = await this.db.user.findFirst({
        where: {
          OR: [
            { email: userData.email.toLowerCase() },
            { username: userData.username.toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === userData.email.toLowerCase()) {
          throw new ConflictError('Email already exists');
        }
        if (existingUser.username === userData.username.toLowerCase()) {
          throw new ConflictError('Username already exists');
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with profile
      const user = await this.db.user.create({
        data: {
          email: userData.email.toLowerCase(),
          username: userData.username.toLowerCase(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: hashedPassword,
          role: (userData.role?.toUpperCase() as UserRole) || 'STUDENT',
          profile: {
            create: {
              phone: userData.phone || null,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      logInfo('User created successfully', { userId: user.id, email: user.email });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      logError('Failed to create user', error, { email: userData.email });

      if (error instanceof ConflictError) {
        throw error;
      }

      throw new DatabaseError('Failed to create user');
    }
  }

  // Authenticate user
  async authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<UserWithoutPassword>> {
    try {
      const { email, username, password } = loginData;

      // Find user by email or username
      const user = await this.db.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(username ? [{ username: username.toLowerCase() }] : []),
          ],
        },
        include: {
          profile: true,
        },
      });

      if (!user) {
        throw new AuthError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new AuthError('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new AuthError('Invalid credentials');
      }

      // Update last login
      await this.db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logInfo('User authenticated successfully', { userId: user.id, email: user.email });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      logError('Authentication failed', error, {
        email: loginData.email,
        username: loginData.username,
      });

      if (error instanceof AuthError) {
        throw error;
      }

      throw new DatabaseError('Authentication failed');
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<ServiceResponse<UserWithoutPassword | null>> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        return {
          success: true,
          data: null,
        };
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      logError('Failed to get user by ID', error, { userId });
      throw new DatabaseError('Failed to retrieve user');
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<ServiceResponse<UserWithoutPassword | null>> {
    try {
      const user = await this.db.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          profile: true,
        },
      });

      if (!user) {
        return {
          success: true,
          data: null,
        };
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      logError('Failed to get user by email', error, { email });
      throw new DatabaseError('Failed to retrieve user');
    }
  }

  // Update user password
  async updatePassword(userId: string, newPassword: string): Promise<ServiceResponse<boolean>> {
    try {
      const hashedPassword = await hashPassword(newPassword);

      await this.db.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      logInfo('Password updated successfully', { userId });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logError('Failed to update password', error, { userId });
      throw new DatabaseError('Failed to update password');
    }
  }

  // Verify user email
  async verifyEmail(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logInfo('Email verified successfully', { userId });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logError('Failed to verify email', error, { userId });
      throw new DatabaseError('Failed to verify email');
    }
  }

  // Deactivate user account
  async deactivateUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      logInfo('User deactivated successfully', { userId });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logError('Failed to deactivate user', error, { userId });
      throw new DatabaseError('Failed to deactivate user');
    }
  }

  // Get users with pagination and filtering
  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: UserRole
  ): Promise<ServiceResponse<{ users: UserWithoutPassword[]; total: number; totalPages: number }>> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.UserWhereInput = {
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      };

      // Get users and total count
      const [users, total] = await Promise.all([
        this.db.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            profile: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.db.user.count({ where }),
      ]);

      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user as UserWithoutPassword);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          users: usersWithoutPasswords,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logError('Failed to get users', error, { page, limit, search, role });
      throw new DatabaseError('Failed to retrieve users');
    }
  }

  // Create session
  async createSession(
    userId: string,
    token: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      await this.db.session.create({
        data: {
          userId,
          token,
          expiresAt,
          userAgent: userAgent || null,
          ipAddress: ipAddress || null,
        },
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logError('Failed to create session', error, { userId });
      throw new DatabaseError('Failed to create session');
    }
  }

  // Invalidate session
  async invalidateSession(token: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.db.session.updateMany({
        where: { token },
        data: { isActive: false },
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      logError('Failed to invalidate session', error);
      throw new DatabaseError('Failed to invalidate session');
    }
  }

  // Clean expired sessions
  async cleanExpiredSessions(): Promise<ServiceResponse<number>> {
    try {
      const result = await this.db.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
        },
      });

      logInfo('Expired sessions cleaned', { deletedCount: result.count });

      return {
        success: true,
        data: result.count,
      };
    } catch (error) {
      logError('Failed to clean expired sessions', error);
      throw new DatabaseError('Failed to clean expired sessions');
    }
  }

  // Generate OTP for phone/email verification
  async generateOTP(
    identifier: string, 
    identifierType: 'email' | 'phone', 
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<{ otpId: string }>> {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiry time (5 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Find user if it's for an existing user
      let userId: string | null = null;
      if (identifierType === 'email') {
        const userResult = await this.getUserByEmail(identifier);
        userId = userResult.data?.id || null;
      } else if (identifierType === 'phone') {
        const userResult = await this.getUserByPhone(identifier);
        userId = userResult.data?.id || null;
      }

      // Invalidate any existing OTPs for this identifier and purpose
      await this.db.oTPVerification.updateMany({
        where: {
          identifier: identifier.toLowerCase(),
          purpose,
          isUsed: false,
        },
        data: {
          isUsed: true,
        },
      });

      // Create new OTP record
      const otpRecord = await this.db.oTPVerification.create({
        data: {
          identifier: identifier.toLowerCase(),
          identifierType,
          otp,
          purpose,
          userId,
          expiresAt,
          attempts: 0,
          maxAttempts: 3,
          isUsed: false,
        },
      });

      logInfo('OTP generated successfully', { 
        otpId: otpRecord.id, 
        identifier: identifier.toLowerCase(), 
        purpose 
      });

      // TODO: Send OTP via SMS/Email service
      // For now, we'll just log it for testing (remove in production)
      if (process.env.NODE_ENV === 'development') {
        logInfo('Generated OTP (DEV ONLY)', { otp, identifier });
      }

      return {
        success: true,
        data: { otpId: otpRecord.id },
      };
    } catch (error) {
      logError('Failed to generate OTP', error, { identifier, identifierType, purpose });
      throw new DatabaseError('Failed to generate OTP');
    }
  }

  // Verify OTP
  async verifyOTP(
    identifier: string,
    identifierType: 'email' | 'phone',
    otp: string,
    purpose: 'login' | 'password_reset' | 'email_verification'
  ): Promise<ServiceResponse<{ user?: any; verified: boolean }>> {
    try {
      // Find the OTP record
      const otpRecord = await this.db.oTPVerification.findFirst({
        where: {
          identifier: identifier.toLowerCase(),
          identifierType,
          purpose,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return {
          success: false,
          error: 'Invalid or expired OTP',
        };
      }

      // Check attempt limits
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        // Mark as used to prevent further attempts
        await this.db.oTPVerification.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        });

        return {
          success: false,
          error: 'Too many incorrect attempts. Please request a new OTP.',
        };
      }

      // Increment attempt count
      await this.db.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      // Verify OTP
      if (otpRecord.otp !== otp) {
        return {
          success: false,
          error: 'Invalid OTP',
        };
      }

      // Mark OTP as used
      await this.db.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      // Get user if exists
      let user: any = null;
      if (otpRecord.userId) {
        const userResult = await this.getUserById(otpRecord.userId);
        user = userResult.data;
      } else if (identifierType === 'email') {
        const userResult = await this.getUserByEmail(identifier);
        user = userResult.data;
      } else if (identifierType === 'phone') {
        // TODO: Implement getUserByPhone
        // For phone login, we might need to create user or find by phone
      }

      logInfo('OTP verified successfully', { 
        otpId: otpRecord.id, 
        identifier: identifier.toLowerCase(), 
        purpose,
        userId: user?.id 
      });

      return {
        success: true,
        data: { user, verified: true },
      };
    } catch (error) {
      logError('Failed to verify OTP', error, { identifier, identifierType, purpose });
      throw new DatabaseError('Failed to verify OTP');
    }
  }

  // Get user by phone number (helper method)
  async getUserByPhone(phone: string): Promise<ServiceResponse<UserWithoutPassword | null>> {
    try {
      // Find user through profile phone number
      const profile = await this.db.userProfile.findFirst({
        where: { phone },
        include: { user: true },
      });

      if (!profile || !profile.user) {
        return {
          success: true,
          data: null,
        };
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = profile.user;

      return {
        success: true,
        data: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      logError('Failed to get user by phone', error, { phone });
      throw new DatabaseError('Failed to retrieve user');
    }
  }
}

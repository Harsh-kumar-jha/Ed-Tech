import { User, UserRole, Prisma } from '@prisma/client';
import { getPrisma } from '@/utils/database';
import { hashPassword, comparePassword } from '@/services/Auth/utils/auth';
import { DatabaseError, AuthError, ConflictError } from '@/utils/exceptions';
import { CreateUserRequest, LoginRequest, ServiceResponse } from '@/types';
import { logInfo, logError } from '@/utils/logger';

export class AuthModel {
  private db = getPrisma();

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<ServiceResponse<User>> {
    try {
      // Check if user already exists
      const existingUser = await this.db.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new ConflictError('Email already exists');
        }
        if (existingUser.username === userData.username) {
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
          role: userData.role || UserRole.STUDENT,
          profile: {
            create: {
              studyGoals: [],
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
        data: userWithoutPassword as User,
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
  async authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<User>> {
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
        data: userWithoutPassword as User,
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
  async getUserById(userId: string): Promise<ServiceResponse<User | null>> {
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
        data: userWithoutPassword as User,
      };
    } catch (error) {
      logError('Failed to get user by ID', error, { userId });
      throw new DatabaseError('Failed to retrieve user');
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<ServiceResponse<User | null>> {
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
        data: userWithoutPassword as User,
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

  // Get users with pagination
  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: UserRole
  ): Promise<ServiceResponse<{ users: User[]; total: number; totalPages: number }>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        this.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            profile: true,
          },
        }),
        this.db.user.count({ where }),
      ]);

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });

      return {
        success: true,
        data: {
          users: usersWithoutPasswords,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logError('Failed to get users', error);
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
          userAgent,
          ipAddress,
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
}

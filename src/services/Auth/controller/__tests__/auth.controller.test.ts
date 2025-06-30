/**
 * Auth Controller Unit Tests
 * TDD approach: Write failing tests first, then implement controller
 */

import { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthModel } from '../../../../models/Auth.model';
import { generateTokens } from '../../utils/auth';
import { logError } from '../../../../utils/logger';

// Mock dependencies
jest.mock('../../../../models/Auth.model');
jest.mock('../../utils/auth');
jest.mock('../../../../utils/logger');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthModel: jest.Mocked<AuthModel>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockAuthModel = new AuthModel() as jest.Mocked<AuthModel>;
    authController = new AuthController();
    
    // Mock the AuthModel methods that don't exist yet
    mockAuthModel.generateOTP = jest.fn();
    mockAuthModel.verifyOTP = jest.fn();
    
    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPass123!',
      phone: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed-password',
        role: 'STUDENT' as const,
        isActive: true,
        isEmailVerified: false,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthModel.createUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (generateTokens as jest.Mock).mockReturnValue(mockTokens);

      mockRequest.body = validRegisterData;

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthModel.createUser).toHaveBeenCalledWith(validRegisterData);
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });
    });

    it('should handle email already exists error', async () => {
      // Arrange
      mockAuthModel.createUser.mockRejectedValue(new Error('Email already exists'));
      mockRequest.body = validRegisterData;

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing required fields', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com' }; // Missing required fields

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'TestPass123!',
    };

    it('should login user successfully with email/password', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed-password',
        role: 'STUDENT' as const,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthModel.authenticateUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (generateTokens as jest.Mock).mockReturnValue(mockTokens);

      mockRequest.body = validLoginData;

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthModel.authenticateUser).toHaveBeenCalledWith(validLoginData);
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });
    });

    it('should handle invalid credentials', async () => {
      // Arrange
      mockAuthModel.authenticateUser.mockRejectedValue(new Error('Invalid credentials'));
      mockRequest.body = validLoginData;

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('phoneLogin', () => {
    const validPhoneData = {
      phone: '+1234567890',
    };

    it('should initiate phone login with OTP', async () => {
      // Arrange
      mockAuthModel.generateOTP.mockResolvedValue({
        success: true,
        data: { otpId: 'otp-id' },
      });

      mockRequest.body = validPhoneData;

      // Act
      await authController.phoneLogin(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthModel.generateOTP).toHaveBeenCalledWith(
        validPhoneData.phone,
        'phone',
        'login'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP sent to your phone',
        data: { otpId: 'otp-id' },
      });
    });

    it('should handle invalid phone number', async () => {
      // Arrange
      mockRequest.body = { phone: 'invalid-phone' };

      // Act
      await authController.phoneLogin(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('verifyOTP', () => {
    const validOTPData = {
      phone: '+1234567890',
      otp: '123456',
      type: 'login' as const,
    };

    it('should verify OTP and login user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed-password',
        role: 'STUDENT' as const,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthModel.verifyOTP.mockResolvedValue({
        success: true,
        data: { user: mockUser, verified: true },
      });

      (generateTokens as jest.Mock).mockReturnValue(mockTokens);

      mockRequest.body = validOTPData;

      // Act
      await authController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthModel.verifyOTP).toHaveBeenCalledWith(
        validOTPData.phone,
        'phone',
        validOTPData.otp,
        validOTPData.type
      );
      expect(generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });
    });

    it('should handle invalid OTP', async () => {
      // Arrange
      mockAuthModel.verifyOTP.mockResolvedValue({
        success: false,
        error: 'Invalid OTP',
      });

      mockRequest.body = validOTPData;

      // Act
      await authController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid OTP',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset with email', async () => {
      const requestData = { email: 'test@example.com' };
      mockAuthModel.generateOTP.mockResolvedValue({
        success: true,
        data: { otpId: 'otp-id' },
      });
      mockRequest.body = requestData;

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthModel.generateOTP).toHaveBeenCalledWith(
        requestData.email,
        'email',
        'password_reset'
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with OTP successfully', async () => {
      const validResetData = {
        email: 'test@example.com',
        otp: '123456',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      mockAuthModel.verifyOTP.mockResolvedValue({
        success: true,
        data: { user: { id: 'user-id' }, verified: true },
      });

      mockAuthModel.updatePassword.mockResolvedValue({
        success: true,
        data: true,
      });

      mockRequest.body = validResetData;

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthModel.verifyOTP).toHaveBeenCalledWith(
        validResetData.email,
        'email',
        validResetData.otp,
        'password_reset'
      );
    });
  });
}); 
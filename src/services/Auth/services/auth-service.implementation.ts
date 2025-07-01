/**
 * Auth Service Implementation
 * Wraps AuthModel and implements IAuthService interface for Dependency Injection
 */

import { IAuthService } from '../../../interface/services.interface';
import { AuthModel } from '../../../models/Auth.model';
import { 
  ServiceResponse, 
  CreateUserRequest, 
  LoginRequest, 
  UserWithoutPassword 
} from '../../../interface';

export class AuthServiceImpl implements IAuthService {
  readonly serviceName = 'AuthService';
  private authModel = new AuthModel();

  async createUser(userData: CreateUserRequest): Promise<ServiceResponse<UserWithoutPassword>> {
    return this.authModel.createUser(userData);
  }

  async authenticateUser(loginData: LoginRequest): Promise<ServiceResponse<UserWithoutPassword>> {
    return this.authModel.authenticateUser(loginData);
  }

  async getUserById(userId: string): Promise<ServiceResponse<UserWithoutPassword | null>> {
    return this.authModel.getUserById(userId);
  }

  async getUserByEmail(email: string): Promise<ServiceResponse<UserWithoutPassword | null>> {
    return this.authModel.getUserByEmail(email);
  }

  async updatePassword(userId: string, newPassword: string): Promise<ServiceResponse<boolean>> {
    return this.authModel.updatePassword(userId, newPassword);
  }

  async verifyEmail(userId: string): Promise<ServiceResponse<boolean>> {
    return this.authModel.verifyEmail(userId);
  }

  async deactivateUser(userId: string): Promise<ServiceResponse<boolean>> {
    return this.authModel.deactivateUser(userId);
  }
} 
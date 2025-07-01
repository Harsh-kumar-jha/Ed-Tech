/**
 * Token Service Implementation
 * Handles JWT token operations following the ITokenService interface
 */

import { ITokenService } from '../../../interface/services.interface';
import { User } from '../../../interface';
import { 
  generateTokens as utilGenerateTokens,
  verifyAccessToken as utilVerifyAccessToken,
  verifyRefreshToken as utilVerifyRefreshToken,
  extractTokenFromHeader as utilExtractTokenFromHeader,
  blacklistToken as utilBlacklistToken,
  isTokenBlacklisted as utilIsTokenBlacklisted
} from '../utils/auth';

export class TokenService implements ITokenService {
  readonly serviceName = 'TokenService';

  generateTokens(user: User): any {
    return utilGenerateTokens(user);
  }

  verifyAccessToken(token: string): any {
    return utilVerifyAccessToken(token);
  }

  verifyRefreshToken(token: string): { userId: string } {
    return utilVerifyRefreshToken(token);
  }

  extractTokenFromHeader(authorization?: string): string | null {
    return utilExtractTokenFromHeader(authorization);
  }

  async blacklistToken(token: string): Promise<void> {
    return utilBlacklistToken(token);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return utilIsTokenBlacklisted(token);
  }
} 
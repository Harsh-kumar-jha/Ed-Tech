/**
 * Password Reset Flow Validation Script
 * 
 * This script validates the complete password reset security flow.
 * Following SOLID principles and demonstrating the enhanced security features.
 * 
 * Usage: Run this script in development environment to validate the flow
 */

import { AuthModel } from '../models/Auth.model';
import { logInfo, logError } from '../utils/logger';

interface TestUser {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  newPassword: string;
  phone?: string;
}

/**
 * Test Strategy Pattern Implementation
 * Different test strategies for different scenarios
 */
abstract class PasswordResetTestStrategy {
  protected authModel: AuthModel;

  constructor() {
    this.authModel = new AuthModel();
  }

  abstract runTest(user: TestUser): Promise<boolean>;
}

/**
 * Email-based Password Reset Test
 */
class EmailPasswordResetTest extends PasswordResetTestStrategy {
  async runTest(user: TestUser): Promise<boolean> {
    try {
      logInfo('🧪 Starting Email Password Reset Test', { email: user.email });

      // Step 1: Create test user
      const createResult = await this.authModel.createUser(user);
      if (!createResult.success || !createResult.data) {
        logError('❌ Failed to create test user', new Error(createResult.error || 'Unknown error'));
        return false;
      }

      const userId = createResult.data.id;
      logInfo('✅ Test user created', { userId });

      // Step 2: Authenticate with old password
      const authResult = await this.authModel.authenticateUser({
        email: user.email,
        password: user.password
      });

      if (!authResult.success) {
        logError('❌ Failed to authenticate with old password', new Error(authResult.error || 'Unknown error'));
        return false;
      }
      logInfo('✅ Authentication with old password successful');

      // Step 3: Generate password reset OTP
      const otpResult = await this.authModel.generateOTP(user.email, 'email', 'password_reset');
      if (!otpResult.success) {
        logError('❌ Failed to generate OTP', new Error(otpResult.error || 'Unknown error'));
        return false;
      }
      logInfo('✅ Password reset OTP generated');

      // Step 4: Get OTP from database (test environment)
      const otpRecord = await this.authModel['db'].oTPVerification.findFirst({
        where: {
          identifier: user.email.toLowerCase(),
          purpose: 'password_reset',
          isUsed: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        logError('❌ OTP record not found in database');
        return false;
      }

      // Step 5: Verify OTP and check user retrieval
      const verifyResult = await this.authModel.verifyOTP(
        user.email, 
        'email', 
        otpRecord.otp, 
        'password_reset'
      );

      if (!verifyResult.success || !verifyResult.data?.verified) {
        logError('❌ OTP verification failed', new Error(verifyResult.error || 'Unknown error'));
        return false;
      }

      if (!verifyResult.data.user) {
        logError('❌ User not retrieved during OTP verification');
        return false;
      }

      logInfo('✅ OTP verification successful with user data');

      // Step 6: Update password
      const updateResult = await this.authModel.updatePassword(userId, user.newPassword);
      if (!updateResult.success) {
        logError('❌ Password update failed', new Error(updateResult.error || 'Unknown error'));
        return false;
      }
      logInfo('✅ Password updated successfully');

      // Step 7: Invalidate all user sessions (Enhanced Security)
      const sessionResult = await this.authModel.invalidateAllUserSessions(userId);
      if (!sessionResult.success) {
        logError('❌ Session invalidation failed', new Error(sessionResult.error || 'Unknown error'));
        return false;
      }
      logInfo('✅ All user sessions invalidated', { invalidatedCount: sessionResult.data });

      // Step 8: Verify old password no longer works
      const oldPasswordTest = await this.authModel.authenticateUser({
        email: user.email,
        password: user.password // Old password
      });

      if (oldPasswordTest.success) {
        logError('❌ SECURITY ISSUE: Old password still works after reset!');
        return false;
      }
      logInfo('✅ Old password correctly rejected');

      // Step 9: Verify new password works
      const newPasswordTest = await this.authModel.authenticateUser({
        email: user.email,
        password: user.newPassword // New password
      });

      if (!newPasswordTest.success) {
        logError('❌ New password authentication failed', new Error(newPasswordTest.error || 'Unknown error'));
        return false;
      }
      logInfo('✅ New password authentication successful');

      // Cleanup
      await this.authModel.deactivateUser(userId);
      logInfo('🧹 Test user cleaned up');

      return true;

    } catch (error) {
      logError('❌ Test failed with exception', error);
      return false;
    }
  }
}

/**
 * Phone-based Password Reset Test
 */
class PhonePasswordResetTest extends PasswordResetTestStrategy {
  async runTest(user: TestUser): Promise<boolean> {
    if (!user.phone) {
      logError('❌ Phone number required for phone-based test');
      return false;
    }

    try {
      logInfo('🧪 Starting Phone Password Reset Test', { phone: user.phone.substring(0, 5) + '***' });

      // Step 1: Create test user with phone
      const createResult = await this.authModel.createUser(user);
      if (!createResult.success || !createResult.data) {
        logError('❌ Failed to create test user', new Error(createResult.error || 'Unknown error'));
        return false;
      }

      const userId = createResult.data.id;

      // Step 2: Add phone to user profile
      await this.authModel['db'].userProfile.update({
        where: { userId },
        data: { phone: user.phone }
      });

      // Step 3: Test getUserByPhone implementation
      const phoneUserResult = await this.authModel.getUserByPhone(user.phone);
      if (!phoneUserResult.success || !phoneUserResult.data) {
        logError('❌ getUserByPhone failed');
        return false;
      }
      logInfo('✅ getUserByPhone implementation working');

      // Step 4: Generate OTP for phone
      const otpResult = await this.authModel.generateOTP(user.phone, 'phone', 'password_reset');
      if (!otpResult.success) {
        logError('❌ Failed to generate phone OTP', new Error(otpResult.error || 'Unknown error'));
        return false;
      }

      // Step 5: Verify phone OTP handling
      const otpRecord = await this.authModel['db'].oTPVerification.findFirst({
        where: {
          identifier: user.phone,
          purpose: 'password_reset',
          isUsed: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        logError('❌ Phone OTP record not found');
        return false;
      }

      const verifyResult = await this.authModel.verifyOTP(
        user.phone, 
        'phone', 
        otpRecord.otp, 
        'password_reset'
      );

      if (!verifyResult.success || !verifyResult.data?.user) {
        logError('❌ Phone OTP verification failed');
        return false;
      }

      logInfo('✅ Phone-based password reset flow working');

      // Cleanup
      await this.authModel.deactivateUser(userId);
      return true;

    } catch (error) {
      logError('❌ Phone test failed with exception', error);
      return false;
    }
  }
}

/**
 * Test Runner - Command Pattern Implementation
 */
class PasswordResetTestRunner {
  private strategies: PasswordResetTestStrategy[] = [];

  addStrategy(strategy: PasswordResetTestStrategy): void {
    this.strategies.push(strategy);
  }

  async runAllTests(): Promise<void> {
    const testUser: TestUser = {
      email: 'test.security@edtech.com',
      username: 'testsecurity',
      firstName: 'Test',
      lastName: 'Security',
      password: 'OldPassword123!',
      newPassword: 'NewSecurePassword456!',
      phone: '+1234567890'
    };

    logInfo('🚀 Starting Password Reset Security Validation');
    
    let passedTests = 0;
    let totalTests = this.strategies.length;

    for (const [index, strategy] of this.strategies.entries()) {
      logInfo(`📋 Running Test ${index + 1}/${totalTests}:`, { strategy: strategy.constructor.name });
      
      const result = await strategy.runTest(testUser);
      if (result) {
        passedTests++;
        logInfo(`✅ Test ${index + 1} PASSED`);
      } else {
        logError(`❌ Test ${index + 1} FAILED`);
      }
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logInfo('📊 Test Summary', {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    });

    if (passedTests === totalTests) {
      logInfo('🎉 ALL TESTS PASSED - Security implementation is working correctly!');
    } else {
      logError('⚠️  SOME TESTS FAILED - Security issues detected!');
    }
  }
}

/**
 * Main execution function
 */
export async function validatePasswordResetSecurity(): Promise<void> {
  const testRunner = new PasswordResetTestRunner();
  
  // Add test strategies
  testRunner.addStrategy(new EmailPasswordResetTest());
  testRunner.addStrategy(new PhonePasswordResetTest());
  
  await testRunner.runAllTests();
}

// Export for use in other modules
export { PasswordResetTestRunner, EmailPasswordResetTest, PhonePasswordResetTest };

// Self-executing script when run directly
if (require.main === module) {
  validatePasswordResetSecurity()
    .then(() => {
      logInfo('🏁 Validation script completed');
      process.exit(0);
    })
    .catch((error) => {
      logError('💥 Validation script failed', error);
      process.exit(1);
    });
} 
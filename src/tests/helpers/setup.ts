/**
 * Jest Test Setup
 * This file runs before all tests and sets up the testing environment
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Global test timeout (30 seconds)
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
(global as any).testHelpers = {
  // Add common test utilities here
  generateTestUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT'
  }),
  
  generateTestToken: () => 'test-jwt-token',
  
  mockPrismaClient: () => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    // Add other model mocks as needed
  })
};

// Cleanup after all tests
afterAll(async () => {
  // Close database connections, clear caches, etc.
  console.log('Test cleanup completed');
}); 
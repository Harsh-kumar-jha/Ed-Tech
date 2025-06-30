/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory
  rootDir: './src',

  // Module path mapping (same as tsconfig.json)
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.spec.ts'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '../coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Coverage thresholds for TDD
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/tests/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!server.ts',
    '!**/index.ts'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Max worker processes for parallel testing
  maxWorkers: '50%'
}; 
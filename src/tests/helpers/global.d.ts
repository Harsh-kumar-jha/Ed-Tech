/**
 * Global Test Types
 * Type declarations for Jest global test helpers
 */

declare global {
  namespace NodeJS {
    interface Global {
      testHelpers: {
        generateTestUser: () => {
          id: string;
          email: string;
          username: string;
          firstName: string;
          lastName: string;
          role: string;
        };
        generateTestToken: () => string;
        mockPrismaClient: () => any;
      };
    }
  }

  var testHelpers: {
    generateTestUser: () => {
      id: string;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    generateTestToken: () => string;
    mockPrismaClient: () => any;
  };
}

export {}; 
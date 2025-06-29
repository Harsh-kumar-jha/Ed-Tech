// User Roles and Permissions
export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const PERMISSIONS = {
  USER: {
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
  },
  TEST: {
    CREATE: 'test:create',
    READ: 'test:read',
    UPDATE: 'test:update',
    DELETE: 'test:delete',
    SUBMIT: 'test:submit',
    GRADE: 'test:grade',
  },
  ADMIN: {
    SYSTEM: 'admin:system',
    USERS: 'admin:users',
    REPORTS: 'admin:reports',
  },
} as const; 
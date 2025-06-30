// JWT token payload interface
export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
  }

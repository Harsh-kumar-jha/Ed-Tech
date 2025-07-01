/**
 * System domain interfaces for configuration, monitoring, and infrastructure
 */

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUNDS: number;
  LOG_LEVEL: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  MAX_FILE_SIZE: number;
  ALLOWED_ORIGINS: string;
}

export interface FileUpload {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface SocketUser {
  id: string;
  username: string;
  role: string;
}

export interface SocketMessage {
  event: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface Metrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

export interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
} 
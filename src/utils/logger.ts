import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }: any) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create daily rotate file transport for error logs
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  handleExceptions: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create daily rotate file transport for combined logs
const combinedFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create daily rotate file transport for access logs
const accessFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ielts-edtech-platform' },
  transports: [
    errorFileRotateTransport,
    combinedFileRotateTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create separate access logger for HTTP requests
export const accessLogger = winston.createLogger({
  format: logFormat,
  transports: [accessFileRotateTransport],
});

// Add methods for different log levels
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  logger.error(message, { error: error?.stack || error, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger; 
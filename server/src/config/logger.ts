/**
 * Logging Configuration
 * 
 * Centralized logging setup with different levels and outputs
 * for development and production environments.
 */

import winston from 'winston';
import path from 'path';
import { loggingConfig } from './security.js';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  // Console transport for production (structured logging)
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// File transport for production
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Ensure logs directory exists
  const logDir = path.dirname(loggingConfig.file);
  
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: loggingConfig.file,
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: loggingConfig.level,
  levels: logLevels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports,
  exitOnError: false,
});

// Create audit logger for security events
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  ],
});

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_LINKED = 'ACCOUNT_LINKED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// Audit logging function
export const logSecurityEvent = (
  eventType: SecurityEventType,
  userId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  if (!loggingConfig.auditLog) return;

  auditLogger.info({
    eventType,
    userId,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString()
  });
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

// Error logging function
export const logError = (error: Error, context?: any) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, details?: any) => {
  if (loggingConfig.level === 'debug') {
    logger.debug({
      type: 'PERFORMANCE',
      operation,
      duration: `${duration}ms`,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Database query logging
export const logDatabaseQuery = (query: string, duration: number, error?: Error) => {
  if (error) {
    logger.error({
      type: 'DATABASE_ERROR',
      query,
      duration: `${duration}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } else if (loggingConfig.level === 'debug') {
    logger.debug({
      type: 'DATABASE_QUERY',
      query,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// Health check logging
export const logHealthCheck = (status: 'healthy' | 'unhealthy', details: any) => {
  const logLevel = status === 'healthy' ? 'info' : 'error';
  logger[logLevel]({
    type: 'HEALTH_CHECK',
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

// Startup logging
export const logStartup = (port: number, environment: string) => {
  logger.info({
    type: 'SERVER_START',
    port,
    environment,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
};

// Shutdown logging
export const logShutdown = (reason: string) => {
  logger.info({
    type: 'SERVER_SHUTDOWN',
    reason,
    timestamp: new Date().toISOString()
  });
};

export default logger;
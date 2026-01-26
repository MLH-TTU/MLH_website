/**
 * Security Configuration
 * 
 * Centralized security settings for production deployment
 * including rate limiting, CORS, headers, and monitoring.
 */

import rateLimit from 'express-rate-limit';
import { CorsOptions } from 'cors';

export interface SecurityConfig {
  cors: CorsOptions;
  rateLimiting: {
    general: any;
    auth: any;
    upload: any;
  };
  headers: {
    contentSecurityPolicy: any;
    crossOriginEmbedderPolicy: boolean;
  };
  session: {
    secret: string;
    secure: boolean;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    name: string;
  };
}

/**
 * Get allowed origins for CORS
 */
const getAllowedOrigins = (): string[] => {
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    return corsOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins for development
  return [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://localhost:3000'
  ];
};

/**
 * CORS Configuration
 */
export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  general: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  }),

  auth: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
      });
    }
  }),

  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20'),
    message: {
      success: false,
      error: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      console.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many file uploads, please try again later.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
      });
    }
  })
};

/**
 * Security Headers Configuration
 */
export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.github.com", "https://graph.microsoft.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true
};

/**
 * Session Configuration
 */
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax' as const
  },
  name: 'mlh.session',
  rolling: true, // Reset expiration on activity
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
};

/**
 * File Upload Security Configuration
 */
export const fileUploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf'],
  maxFiles: 2,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  tempDir: process.env.TEMP_DIR || 'temp',
  virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true',
  quarantineDir: process.env.QUARANTINE_DIR || 'quarantine'
};

/**
 * Validation Configuration
 */
export const validationConfig = {
  maxRequestSize: '10mb',
  maxUrlLength: 2048,
  maxHeaderSize: 8192,
  parameterLimit: 1000,
  strictMode: process.env.NODE_ENV === 'production'
};

/**
 * Logging Configuration
 */
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/app.log',
  maxSize: '10m',
  maxFiles: '14d',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
  auditLog: process.env.AUDIT_LOG_ENABLED === 'true'
};

/**
 * Monitoring Configuration
 */
export const monitoringConfig = {
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  metricsEnabled: process.env.METRICS_ENABLED === 'true',
  alertingEnabled: process.env.ALERTING_ENABLED === 'true',
  performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true'
};

/**
 * Complete Security Configuration
 */
export const securityConfig: SecurityConfig = {
  cors: corsConfig,
  rateLimiting: rateLimitConfig,
  headers: securityHeaders,
  session: sessionConfig
};

/**
 * Environment Validation
 */
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      console.warn('Using default values for missing environment variables in development');
    }
  }

  // Validate session secret strength in production
  if (process.env.NODE_ENV === 'production') {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long in production');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
  }
};

/**
 * Security Middleware Factory
 */
export const createSecurityMiddleware = () => {
  return {
    validateEnvironment,
    corsConfig,
    rateLimitConfig,
    securityHeaders,
    sessionConfig,
    fileUploadConfig,
    validationConfig,
    loggingConfig,
    monitoringConfig
  };
};
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import fileRoutes from './routes/files';
import integrationRoutes from './routes/integration';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  validateEnvironment, 
  corsConfig, 
  rateLimitConfig, 
  securityHeaders, 
  sessionConfig,
  validationConfig 
} from './config/security';
import logger, { 
  requestLogger, 
  logStartup, 
  logShutdown, 
  SecurityEventType, 
  logSecurityEvent 
} from './config/logger';
import { MonitoringService } from './services/monitoring';

const app = express();
const PORT = parseInt(process.env.PORT || '5001');
const prisma = new PrismaClient();
const monitoringService = new MonitoringService(prisma);

// Validate environment variables
try {
  validateEnvironment();
  logger.info('Environment validation passed');
} catch (error) {
  logger.error('Environment validation failed:', error);
  process.exit(1);
}

// Security middleware
app.use(helmet(securityHeaders));

// Request logging
app.use(requestLogger);

// Performance monitoring
app.use(monitoringService.performanceMiddleware());

// Rate limiting with different limits for different endpoints
app.use('/api/', rateLimitConfig.general);
app.use('/auth/', rateLimitConfig.auth);
app.use('/api/files/', rateLimitConfig.upload);
app.use('/api/integration/onboarding', rateLimitConfig.upload);
app.use('/api/integration/profile', rateLimitConfig.upload);

// CORS configuration with enhanced security
app.use(cors(corsConfig));

// Body parsing with size limits
app.use(express.json({ 
  limit: validationConfig.maxRequestSize,
  verify: (req, res, buf) => {
    // Log suspicious large requests
    if (buf.length > 1024 * 1024) { // 1MB
      logger.warn('Large request body detected', {
        size: buf.length,
        ip: (req as any).ip,
        path: req.url
      });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: validationConfig.maxRequestSize,
  parameterLimit: validationConfig.parameterLimit
}));

app.use(cookieParser());

// Session configuration with enhanced security
app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Security event logging middleware
app.use((req, res, next) => {
  // Log authentication events
  res.on('finish', () => {
    if (req.path.includes('/auth/') || req.path.includes('/login')) {
      const eventType = res.statusCode === 200 
        ? SecurityEventType.LOGIN_SUCCESS 
        : SecurityEventType.LOGIN_FAILURE;
      
      logSecurityEvent(
        eventType,
        (req as any).user?.id,
        { path: req.path, method: req.method },
        req.ip,
        req.get('User-Agent')
      );
    }
  });
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/integration', integrationRoutes);

// Enhanced health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const healthCheck = await monitoringService.performHealthCheck();
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// System metrics endpoint (protected)
app.get('/api/metrics', async (req: Request, res: Response) => {
  // Simple authentication check - in production, use proper auth
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const healthCheck = await monitoringService.performHealthCheck();
    const requestMetrics = monitoringService.getRequestMetrics();
    
    res.json({
      health: healthCheck,
      requests: requestMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Test database connection with enhanced logging
app.get('/api/hello', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    
    // Get basic statistics
    const userCount = await prisma.user.count();
    const techCount = await prisma.technology.count();
    
    logger.info('Database connection test successful', {
      connectionTime: `${connectionTime}ms`,
      userCount,
      techCount
    });
    
    res.json({ 
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Connected',
      connectionTime: `${connectionTime}ms`,
      statistics: {
        users: userCount,
        technologies: techCount
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Database connection test failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logShutdown(`Received ${signal}`);
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Cleanup monitoring service
    await monitoringService.cleanup();
    
    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// Start server
const server = app.listen(PORT, () => {
  logStartup(PORT, process.env.NODE_ENV || 'development');
  
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security: Enhanced headers and rate limiting enabled`);
  logger.info(`📁 File uploads: ${process.env.UPLOAD_DIR || 'uploads'} directory`);
  logger.info(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Using default'}`);
  logger.info(`📝 Logging: Level ${process.env.LOG_LEVEL || 'info'}`);
  
  // Start periodic health checks
  if (process.env.NODE_ENV === 'production') {
    monitoringService.startPeriodicHealthChecks();
    logger.info('🏥 Health monitoring: Started');
  }
});

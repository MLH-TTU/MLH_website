import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import fileRoutes from './routes/files';
// import integrationRoutes from './routes/integration'; // Temporarily disabled due to TypeScript errors

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Prisma client with error handling
let prisma: PrismaClient;
try {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty'
  });
  console.log('Prisma client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Create a mock prisma object to prevent crashes
  prisma = {
    $connect: () => Promise.reject(new Error('Prisma not initialized')),
    $disconnect: () => Promise.resolve()
  } as any;
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/files', fileRoutes);
// app.use('/api/integration', integrationRoutes); // Temporarily disabled

// Test database connection
app.get('/api/hello', async (_req: Request, res: Response) => {
  try {
    // Test database connection with timeout
    const connectionTest = Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await connectionTest;
    
    res.json({ 
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Very basic endpoint for debugging
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ pong: true, time: Date.now() });
});

// Simple test endpoint (no database)
app.get('/api/test', (_req: Request, res: Response) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint for Vercel
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection with timeout
    const connectionTest = Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await connectionTest;
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({ 
      status: 'Service Unavailable', 
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Check OAuth configuration
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId || googleClientId === 'placeholder-google-client-id' || googleClientId === 'your-actual-google-client-id') {
    console.warn('⚠️  Google OAuth not configured - using development bypass');
    console.warn('   See OAUTH_SETUP.md for setup instructions');
  } else {
    console.log('✅ Google OAuth configured');
  }
});
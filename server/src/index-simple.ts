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
const prisma = new PrismaClient();

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
    // Test database connection
    await prisma.$connect();
    res.json({ 
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      message: 'Hello World from MLH TTU Chapter!',
      database: 'Disconnected',
      error: 'Database connection failed'
    });
  }
});

// Health check endpoint for Vercel
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'Service Unavailable', 
      database: 'Disconnected',
      timestamp: new Date().toISOString() 
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
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
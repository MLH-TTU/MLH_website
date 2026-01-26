import 'dotenv/config';

// Test environment setup
process.env.NODE_ENV = 'test';

// Use SQLite in-memory database for tests to avoid requiring PostgreSQL
process.env.DATABASE_URL = 'file:./test.db';

// Set required environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.SERVER_URL = 'http://localhost:5001';

// Mock console.log in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  console.log = () => {};
}

// Setup test database before running tests
import { getTestClient } from './test-client.js';

export async function setupTestDatabase() {
  const prisma = getTestClient();
  
  try {
    // Ensure database is connected
    await prisma.$connect();
    
    // Clean up any existing data
    await prisma.userTechnology.deleteMany();
    await prisma.accountLinkingToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
    await prisma.technology.deleteMany();
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}
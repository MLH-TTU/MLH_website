# MLH TTU Backend and Onboarding System - Setup Guide

## Project Overview

This project implements a comprehensive backend and onboarding system for the MLH TTU website with multi-provider authentication, duplicate account detection, and comprehensive user profile management.

## Architecture

- **Backend**: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Authentication**: OAuth (Google, Microsoft) + Magic Link
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest + Fast-Check (Property-Based Testing)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd mlh-ttu-chapter
   npm run install:all
   ```

2. **Set up the database:**
   ```bash
   # Install PostgreSQL (macOS with Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb mlh_ttu_db
   createdb mlh_ttu_test  # For testing
   ```

3. **Configure environment variables:**
   ```bash
   # Copy example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your database URL and other settings
   # DATABASE_URL="postgresql://username:password@localhost:5432/mlh_ttu_db?schema=public"
   ```

4. **Set up the database schema:**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

## Development

### Start Development Servers

```bash
# Start both client and server concurrently
npm run dev

# Or start individually:
# Server (http://localhost:5001)
npm run dev --prefix server

# Client (http://localhost:3000)  
npm run dev --prefix client
```

### Database Operations

```bash
cd server

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create and run migrations
npx prisma migrate dev

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Testing

```bash
# Run all tests
npm run test --prefix server
npm run test --prefix client

# Run tests in watch mode
npm run test:watch --prefix server
npm run test:watch --prefix client
```

### Building

```bash
# Build server
npm run build --prefix server

# Build client
npm run build --prefix client

# Build both
npm run build
```

## Project Structure

```
mlh-ttu-chapter/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions (API client)
│   │   └── test/          # Test setup and utilities
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript type definitions
│   │   └── test/          # Test files
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seeding
│   ├── uploads/           # File upload directory
│   └── package.json
└── package.json           # Root package.json for scripts
```

## Environment Variables

### Server (.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mlh_ttu_db?schema=public"

# Authentication
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@mlhttu.com"

# Application URLs
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5001"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"

# Environment
NODE_ENV="development"
```

## API Endpoints

### Current Endpoints
- `GET /api/hello` - Test endpoint with database connection status
- `GET /api/health` - Health check endpoint

### Planned Endpoints (to be implemented)
- Authentication: `/auth/*`
- User Management: `/api/user/*`
- File Upload: `/api/files/*`

## Technology Stack Details

### Backend Dependencies
- **Express**: Web framework
- **Prisma**: Database ORM
- **Passport**: Authentication middleware
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **Joi**: Data validation
- **Nodemailer**: Email sending
- **Vitest**: Testing framework
- **Fast-Check**: Property-based testing

### Frontend Dependencies
- **React**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **React Dropzone**: File upload UI
- **Tailwind CSS**: Styling
- **Vitest**: Testing framework
- **Testing Library**: Component testing

## Next Steps

1. **Task 2**: Implement database schema and models
2. **Task 3**: Set up authentication system
3. **Task 4**: Create user profile services
4. **Task 5**: Implement file upload functionality
5. **Task 6**: Build API routes and endpoints

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 5001
npm run clean-ports
```

### Database Connection Issues
- Ensure PostgreSQL is running: `brew services start postgresql`
- Check DATABASE_URL in server/.env
- Verify database exists: `psql -l`

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Regenerate Prisma client: `cd server && npx prisma generate`

## Contributing

1. Follow the task-based implementation plan in `.kiro/specs/mlh-ttu-backend-onboarding/tasks.md`
2. Write tests for all new functionality (unit tests + property-based tests)
3. Ensure all tests pass before committing
4. Follow TypeScript best practices and maintain type safety
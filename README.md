# MLH TTU Chapter Website

Full-stack application with comprehensive backend and onboarding system featuring multi-provider authentication, duplicate account detection, and user profile management.

## Quick Start

```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Full Setup Guide

For detailed setup instructions, database configuration, and development guidelines, see [SETUP.md](./SETUP.md).

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: OAuth (Google, Microsoft) + Magic Link
- **Testing**: Vitest + Property-Based Testing with Fast-Check
- **Deployment**: Vercel-ready configuration

## Features

✅ **Authentication System**
- Google OAuth integration
- Magic Link email authentication
- Multi-device support
- Secure session management

✅ **User Management**
- Complete onboarding flow
- Profile management with file uploads
- Technology skills tracking
- Social media integration

✅ **File Upload System**
- Profile picture uploads
- Resume uploads
- Secure file serving
- Image optimization

✅ **Security & Performance**
- CORS configuration
- Rate limiting
- Input validation
- Error handling
- Comprehensive testing

## Project Structure

- `/client` - React frontend with TypeScript and Tailwind CSS
- `/server` - Express backend with Prisma ORM and database
- `/.kiro/specs/` - Feature specifications and implementation plans
- `/scripts` - Deployment and setup scripts

## Development Status

✅ **Complete Full-Stack Application**
- Authentication system with Google OAuth and Magic Link
- User onboarding and profile management
- File upload functionality
- Multi-device authentication support
- Production-ready with Vercel deployment configuration
- Comprehensive testing suite

## Deployment

Ready for deployment on Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

This project follows a spec-driven development approach. See the implementation plan in `.kiro/specs/mlh-ttu-backend-onboarding/tasks.md` for detailed task breakdown and requirements.

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
- **Database**: PostgreSQL
- **Authentication**: OAuth (Google, Microsoft) + Magic Link
- **Testing**: Vitest + Property-Based Testing with Fast-Check

## Project Structure

- `/client` - React frontend with TypeScript and Tailwind CSS
- `/server` - Express backend with Prisma ORM and PostgreSQL
- `/.kiro/specs/` - Feature specifications and implementation plans

## Development Status

✅ **Task 1: Project Setup and Core Infrastructure** - Complete
- Node.js/Express/TypeScript backend configured
- Prisma ORM with PostgreSQL schema defined
- React/TypeScript frontend with Tailwind CSS
- Development environment and build tools configured
- Testing framework setup (Vitest + Fast-Check)

🔄 **Next**: Task 2 - Database Schema and Models

## Contributing

This project follows a spec-driven development approach. See the implementation plan in `.kiro/specs/mlh-ttu-backend-onboarding/tasks.md` for detailed task breakdown and requirements.

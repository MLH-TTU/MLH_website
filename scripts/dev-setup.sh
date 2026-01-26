#!/bin/bash

# Development Setup Script for MLH TTU Application
# This script helps set up the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Setting up MLH TTU Application for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

log "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm first."
    exit 1
fi

log "npm version: $(npm --version)"

# Install server dependencies
log "Installing server dependencies..."
cd server
if npm install; then
    success "Server dependencies installed"
else
    error "Failed to install server dependencies"
    exit 1
fi

# Install client dependencies
log "Installing client dependencies..."
cd ../client
if npm install; then
    success "Client dependencies installed"
else
    error "Failed to install client dependencies"
    exit 1
fi

cd ..

# Check environment file
log "Checking environment configuration..."
if [ ! -f "server/.env" ]; then
    warning "Environment file not found. Creating from template..."
    cp server/.env.example server/.env 2>/dev/null || cp server/.env.production server/.env
fi

# Check OAuth configuration
GOOGLE_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID" server/.env | cut -d '=' -f2 | tr -d '"')
if [ "$GOOGLE_CLIENT_ID" = "placeholder-google-client-id" ] || [ -z "$GOOGLE_CLIENT_ID" ]; then
    warning "Google OAuth not configured!"
    echo ""
    echo "To set up Google OAuth:"
    echo "1. Follow the guide in OAUTH_SETUP.md"
    echo "2. Update server/.env with your Google OAuth credentials"
    echo ""
fi

# Check database configuration
DATABASE_URL=$(grep "DATABASE_URL" server/.env | cut -d '=' -f2 | tr -d '"')
if [[ "$DATABASE_URL" == *"username:password"* ]]; then
    warning "Database not configured!"
    echo ""
    echo "To set up the database:"
    echo "1. Install PostgreSQL"
    echo "2. Create a database: createdb mlh_ttu_db"
    echo "3. Update DATABASE_URL in server/.env"
    echo "4. Run: cd server && npm run db:migrate"
    echo ""
fi

# Create uploads directory
log "Creating uploads directory..."
mkdir -p server/uploads
success "Uploads directory created"

# Create logs directory
log "Creating logs directory..."
mkdir -p server/logs
success "Logs directory created"

success "Development setup completed!"

echo ""
echo "=== Next Steps ==="
echo "1. Set up OAuth credentials (see OAUTH_SETUP.md)"
echo "2. Set up your database (see SETUP.md)"
echo "3. Start the development servers:"
echo "   - Server: cd server && npm run dev"
echo "   - Client: cd client && npm run dev"
echo ""
echo "=== Useful Commands ==="
echo "- Check server health: curl http://localhost:5001/api/health"
echo "- View server logs: tail -f server/logs/app.log"
echo "- Run tests: npm test"
echo ""

log "Setup script completed"
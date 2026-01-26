#!/bin/bash

# MLH TTU Application Deployment Script
# This script handles the complete deployment process for the MLH TTU application

set -e  # Exit on any error

# Configuration
APP_NAME="mlh-ttu-app"
APP_DIR="/home/mlhapp/mlh-ttu-app"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deployment.log"
DATE=$(date +%Y%m%d_%H%M%S)
BRANCH=${1:-main}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as correct user
if [ "$USER" != "mlhapp" ]; then
    error "This script must be run as the mlhapp user"
fi

# Check if required directories exist
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR does not exist"
fi

# Create log file if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log "Starting deployment of $APP_NAME from branch: $BRANCH"

# Pre-deployment checks
log "Performing pre-deployment checks..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    error "PM2 is not installed. Please install PM2 first."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js first."
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U mlhuser -d mlh_ttu_production > /dev/null 2>&1; then
    error "PostgreSQL is not running or not accessible"
fi

success "Pre-deployment checks passed"

# Create backup before deployment
log "Creating backup before deployment..."

# Database backup
DB_BACKUP_FILE="$BACKUP_DIR/pre_deploy_db_backup_$DATE.sql.gz"
if pg_dump -h localhost -U mlhuser -d mlh_ttu_production | gzip > "$DB_BACKUP_FILE"; then
    success "Database backup created: $DB_BACKUP_FILE"
else
    error "Failed to create database backup"
fi

# Files backup
FILES_BACKUP_FILE="$BACKUP_DIR/pre_deploy_files_backup_$DATE.tar.gz"
if [ -d "$APP_DIR/uploads" ] && [ "$(ls -A $APP_DIR/uploads)" ]; then
    if tar -czf "$FILES_BACKUP_FILE" -C "$APP_DIR/uploads" .; then
        success "Files backup created: $FILES_BACKUP_FILE"
    else
        warning "Failed to create files backup"
    fi
else
    log "No files to backup in uploads directory"
fi

# Stop applications gracefully
log "Stopping applications..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 stop all
    success "Applications stopped"
else
    log "No PM2 processes found to stop"
fi

# Pull latest code
log "Pulling latest code from branch: $BRANCH"
cd "$APP_DIR"

# Stash any local changes
if [ -n "$(git status --porcelain)" ]; then
    warning "Local changes detected, stashing them"
    git stash push -m "Auto-stash before deployment $DATE"
fi

# Fetch and checkout
if git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull origin "$BRANCH"; then
    success "Code updated successfully"
else
    error "Failed to pull latest code"
fi

# Install/update dependencies
log "Installing dependencies..."

# Backend dependencies
cd "$APP_DIR/server"
if npm ci --only=production; then
    success "Backend dependencies installed"
else
    error "Failed to install backend dependencies"
fi

# Frontend dependencies
cd "$APP_DIR/client"
if npm ci --only=production; then
    success "Frontend dependencies installed"
else
    error "Failed to install frontend dependencies"
fi

# Build applications
log "Building applications..."

# Build backend
cd "$APP_DIR/server"
if npm run build; then
    success "Backend built successfully"
else
    error "Failed to build backend"
fi

# Build frontend
cd "$APP_DIR/client"
if npm run build; then
    success "Frontend built successfully"
else
    error "Failed to build frontend"
fi

# Run database migrations
log "Running database migrations..."
cd "$APP_DIR/server"
if npm run db:migrate; then
    success "Database migrations completed"
else
    error "Database migrations failed"
fi

# Update file permissions
log "Updating file permissions..."
chown -R mlhapp:mlhapp "$APP_DIR"
chmod -R 755 "$APP_DIR/uploads" 2>/dev/null || true
chmod -R 755 "$APP_DIR/logs" 2>/dev/null || true

# Start applications
log "Starting applications..."
cd "$APP_DIR"

if pm2 start ecosystem.config.js; then
    success "Applications started with PM2"
else
    error "Failed to start applications"
fi

# Wait for applications to start
log "Waiting for applications to initialize..."
sleep 15

# Health checks
log "Performing health checks..."

# Backend health check
BACKEND_HEALTH_URL="http://localhost:5001/api/health"
BACKEND_RETRIES=5
BACKEND_HEALTHY=false

for i in $(seq 1 $BACKEND_RETRIES); do
    if curl -f "$BACKEND_HEALTH_URL" > /dev/null 2>&1; then
        BACKEND_HEALTHY=true
        break
    fi
    log "Backend health check attempt $i/$BACKEND_RETRIES failed, retrying in 10 seconds..."
    sleep 10
done

if [ "$BACKEND_HEALTHY" = true ]; then
    success "Backend health check passed"
else
    error "Backend health check failed after $BACKEND_RETRIES attempts"
fi

# Frontend health check
FRONTEND_HEALTH_URL="http://localhost:3000"
FRONTEND_RETRIES=5
FRONTEND_HEALTHY=false

for i in $(seq 1 $FRONTEND_RETRIES); do
    if curl -f "$FRONTEND_HEALTH_URL" > /dev/null 2>&1; then
        FRONTEND_HEALTHY=true
        break
    fi
    log "Frontend health check attempt $i/$FRONTEND_RETRIES failed, retrying in 10 seconds..."
    sleep 10
done

if [ "$FRONTEND_HEALTHY" = true ]; then
    success "Frontend health check passed"
else
    error "Frontend health check failed after $FRONTEND_RETRIES attempts"
fi

# Save PM2 configuration
pm2 save

# Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "pre_deploy_*" -mtime +7 -delete 2>/dev/null || true

# Log deployment completion
log "Deployment completed successfully!"
success "Application is now running and healthy"

# Display status
echo ""
echo "=== Deployment Summary ==="
echo "Date: $(date)"
echo "Branch: $BRANCH"
echo "Database backup: $DB_BACKUP_FILE"
echo "Files backup: $FILES_BACKUP_FILE"
echo "Backend URL: http://localhost:5001"
echo "Frontend URL: http://localhost:3000"
echo ""

# Show PM2 status
pm2 status

log "Deployment script completed successfully"
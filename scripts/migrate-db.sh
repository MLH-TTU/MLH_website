#!/bin/bash

# Database Migration Script for MLH TTU Application
# This script handles database migrations and seeding

set -e

# Configuration
APP_DIR="/home/mlhapp/mlh-ttu-app"
LOG_FILE="$APP_DIR/logs/migration.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create log file if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log "Starting database migration process"

# Check database connectivity
log "Checking database connectivity..."
if ! pg_isready -h localhost -p 5432 -U mlhuser -d mlh_ttu_production > /dev/null 2>&1; then
    error "Cannot connect to PostgreSQL database"
fi
success "Database connection verified"

# Navigate to server directory
cd "$APP_DIR/server"

# Check if Prisma is available
if ! npx prisma --version > /dev/null 2>&1; then
    error "Prisma CLI is not available"
fi

# Create backup before migration
log "Creating database backup before migration..."
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/pre_migration_backup_$DATE.sql.gz"
if pg_dump -h localhost -U mlhuser -d mlh_ttu_production | gzip > "$BACKUP_FILE"; then
    success "Database backup created: $BACKUP_FILE"
else
    error "Failed to create database backup"
fi

# Generate Prisma client
log "Generating Prisma client..."
if npx prisma generate; then
    success "Prisma client generated"
else
    error "Failed to generate Prisma client"
fi

# Check migration status
log "Checking current migration status..."
npx prisma migrate status || true

# Apply pending migrations
log "Applying database migrations..."
if npx prisma migrate deploy; then
    success "Database migrations applied successfully"
else
    error "Database migration failed"
fi

# Seed database if needed
if [ "$1" = "--seed" ] || [ "$1" = "-s" ]; then
    log "Seeding database with initial data..."
    
    # Check if seed script exists
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        if npm run db:seed; then
            success "Database seeded successfully"
        else
            warning "Database seeding failed or no seed script available"
        fi
    else
        log "No seed script found, skipping seeding"
    fi
fi

# Verify database schema
log "Verifying database schema..."
if npx prisma db pull --print > /dev/null 2>&1; then
    success "Database schema verification passed"
else
    warning "Database schema verification had issues"
fi

# Display migration status
log "Final migration status:"
npx prisma migrate status

# Clean up old backups (keep last 10)
log "Cleaning up old migration backups..."
find "$BACKUP_DIR" -name "pre_migration_backup_*.sql.gz" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

success "Database migration process completed successfully"

echo ""
echo "=== Migration Summary ==="
echo "Date: $(date)"
echo "Backup created: $BACKUP_FILE"
echo "Migration status: Success"
echo ""

log "Migration script completed"
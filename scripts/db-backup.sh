#!/bin/bash

###############################################################################
# HotGigs Platform - Database Backup Script
# 
# Creates a backup of the database
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found"
    exit 1
fi

# Extract database configuration
DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2-)

if [ -z "$DB_URL" ]; then
    log_error "DATABASE_URL not found in .env"
    exit 1
fi

# Parse MySQL URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_PORT" ]; then
    DB_PORT=3306
fi

# Create backups directory
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

log_info "Creating database backup..."
log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE_GZ"

# Create backup
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)

log_success "Backup created successfully"
log_info "File: $BACKUP_FILE_GZ"
log_info "Size: $BACKUP_SIZE"

# Optional: Keep only last N backups
MAX_BACKUPS=10
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    log_info "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
    ls -1t "$BACKUP_DIR"/*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    log_success "Old backups removed"
fi

echo ""
log_success "Backup completed successfully!"
echo ""

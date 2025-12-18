#!/bin/bash

###############################################################################
# HotGigs Platform - Manual Database Restore Script
# 
# Restores database from a backup file
# Usage: ./scripts/restore-database.sh <backup_file>
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    log_error ".env file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not found in .env"
    exit 1
fi

# Parse MySQL URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_PORT" ]; then
    DB_PORT=3306
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <backup_file>"
    echo ""
    log_info "Available backups:"
    ls -lht backups/database/*.sql* 2>/dev/null | head -n 10
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    IS_COMPRESSED=true
    UNCOMPRESSED_FILE="${BACKUP_FILE%.gz}"
else
    IS_COMPRESSED=false
    UNCOMPRESSED_FILE="$BACKUP_FILE"
fi

log_warning "╔════════════════════════════════════════════════════╗"
log_warning "║       DATABASE RESTORE - DANGER ZONE               ║"
log_warning "╚════════════════════════════════════════════════════╝"
echo ""
log_warning "This will OVERWRITE all data in the database!"
log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"
log_info "Backup file: $BACKUP_FILE"
echo ""

# Check for metadata file
METADATA_FILE="${BACKUP_FILE%.sql*}.meta.json"
if [ -f "$METADATA_FILE" ]; then
    log_info "Backup metadata:"
    cat "$METADATA_FILE" | grep -E '(timestamp|description|size_mb|created_by)' | sed 's/^/  /'
    echo ""
fi

# Confirmation prompt
read -p "$(echo -e ${RED}Type 'RESTORE' to confirm:${NC} )" CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    log_info "Restore cancelled"
    exit 0
fi

echo ""
log_info "Starting database restore..."

# Check if mysql is available
if ! command -v mysql &> /dev/null; then
    log_error "mysql command not found. Please install MySQL client tools."
    exit 1
fi

# Decompress if needed
if [ "$IS_COMPRESSED" = true ]; then
    log_info "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "$UNCOMPRESSED_FILE.tmp"
    RESTORE_FILE="$UNCOMPRESSED_FILE.tmp"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Create a safety backup before restore
SAFETY_BACKUP="backups/database/pre_restore_$(date +"%Y%m%d_%H%M%S").sql"
log_info "Creating safety backup before restore..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --set-gtid-purged=OFF \
    "$DB_NAME" > "$SAFETY_BACKUP" 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "Safety backup created: $SAFETY_BACKUP"
else
    log_warning "Failed to create safety backup, continuing anyway..."
fi

# Restore database
log_info "Restoring database from backup..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$RESTORE_FILE" 2>/dev/null

if [ $? -ne 0 ]; then
    log_error "Failed to restore database"
    
    # Clean up temp file
    if [ "$IS_COMPRESSED" = true ]; then
        rm -f "$RESTORE_FILE"
    fi
    
    # Offer to restore safety backup
    read -p "$(echo -e ${YELLOW}Do you want to restore the safety backup? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restoring safety backup..."
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SAFETY_BACKUP" 2>/dev/null
        log_success "Safety backup restored"
    fi
    
    exit 1
fi

# Clean up temp file
if [ "$IS_COMPRESSED" = true ]; then
    rm -f "$RESTORE_FILE"
fi

log_success "Database restored successfully!"
echo ""
log_info "Restore Details:"
log_info "  Source: $BACKUP_FILE"
log_info "  Database: $DB_NAME"
log_info "  Safety backup: $SAFETY_BACKUP"
echo ""

log_success "╔════════════════════════════════════════════════════╗"
log_success "║       Restore completed successfully!              ║"
log_success "╚════════════════════════════════════════════════════╝"

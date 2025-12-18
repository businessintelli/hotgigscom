#!/bin/bash

###############################################################################
# HotGigs Platform - Manual Database Backup Script
# 
# Creates a comprehensive backup of the database with metadata
# Usage: ./scripts/backup-database.sh [description]
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

# Create backups directory
BACKUP_DIR="backups/database"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/hotgigs_backup_${TIMESTAMP}.sql"
METADATA_FILE="$BACKUP_DIR/hotgigs_backup_${TIMESTAMP}.meta.json"

# Get description from argument or prompt
DESCRIPTION="${1:-Manual backup via script}"

log_info "╔════════════════════════════════════════════════════╗"
log_info "║       HotGigs Database Backup                      ║"
log_info "╚════════════════════════════════════════════════════╝"
echo ""
log_info "Database: $DB_NAME"
log_info "Host: $DB_HOST:$DB_PORT"
log_info "Backup file: $BACKUP_FILE"
log_info "Description: $DESCRIPTION"
echo ""

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    log_error "mysqldump command not found. Please install MySQL client tools."
    exit 1
fi

# Create backup
log_info "Creating database backup..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null

if [ $? -ne 0 ]; then
    log_error "Failed to create database backup"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Get file size
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
BACKUP_SIZE_MB=$(echo "scale=2; $BACKUP_SIZE / 1024 / 1024" | bc)

# Create metadata file
cat > "$METADATA_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "port": $DB_PORT,
  "filename": "$(basename $BACKUP_FILE)",
  "size_bytes": $BACKUP_SIZE,
  "size_mb": $BACKUP_SIZE_MB,
  "description": "$DESCRIPTION",
  "backup_type": "manual",
  "created_by": "${USER:-unknown}",
  "hostname": "$(hostname)"
}
EOF

log_success "Backup created successfully!"
echo ""
log_info "Backup Details:"
log_info "  File: $BACKUP_FILE"
log_info "  Size: ${BACKUP_SIZE_MB} MB"
log_info "  Metadata: $METADATA_FILE"
echo ""

# Optional: Compress backup
read -p "$(echo -e ${YELLOW}Do you want to compress the backup? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Compressing backup..."
    gzip "$BACKUP_FILE"
    COMPRESSED_SIZE=$(stat -f%z "${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "${BACKUP_FILE}.gz" 2>/dev/null)
    COMPRESSED_SIZE_MB=$(echo "scale=2; $COMPRESSED_SIZE / 1024 / 1024" | bc)
    COMPRESSION_RATIO=$(echo "scale=1; ($BACKUP_SIZE - $COMPRESSED_SIZE) * 100 / $BACKUP_SIZE" | bc)
    
    log_success "Backup compressed successfully!"
    log_info "  Compressed file: ${BACKUP_FILE}.gz"
    log_info "  Compressed size: ${COMPRESSED_SIZE_MB} MB"
    log_info "  Space saved: ${COMPRESSION_RATIO}%"
    echo ""
fi

# List recent backups
log_info "Recent backups:"
ls -lht "$BACKUP_DIR" | head -n 6
echo ""

log_success "╔════════════════════════════════════════════════════╗"
log_success "║       Backup completed successfully!               ║"
log_success "╚════════════════════════════════════════════════════╝"

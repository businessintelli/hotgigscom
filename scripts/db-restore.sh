#!/bin/bash

###############################################################################
# HotGigs Platform - Database Restore Script
# 
# Restores database from a backup file
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

BACKUP_DIR="backups"

# List available backups
log_info "Available backups:"
echo ""

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.sql.gz 2>/dev/null)" ]; then
    log_error "No backups found in $BACKUP_DIR/"
    exit 1
fi

# List backups with numbers
BACKUPS=($(ls -1t "$BACKUP_DIR"/*.sql.gz))
INDEX=1
for BACKUP in "${BACKUPS[@]}"; do
    BACKUP_NAME=$(basename "$BACKUP")
    BACKUP_SIZE=$(du -h "$BACKUP" | cut -f1)
    BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP" 2>/dev/null || stat -c "%y" "$BACKUP" 2>/dev/null | cut -d'.' -f1)
    echo "  [$INDEX] $BACKUP_NAME ($BACKUP_SIZE) - $BACKUP_DATE"
    INDEX=$((INDEX + 1))
done

echo ""
read -p "Enter backup number to restore (or 'q' to quit): " BACKUP_NUM

if [ "$BACKUP_NUM" = "q" ] || [ "$BACKUP_NUM" = "Q" ]; then
    log_info "Operation cancelled"
    exit 0
fi

# Validate input
if ! [[ "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt "${#BACKUPS[@]}" ]; then
    log_error "Invalid backup number"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$((BACKUP_NUM - 1))]}"

log_info "Selected backup: $(basename "$SELECTED_BACKUP")"
echo ""
log_warning "This will:"
log_warning "  1. DROP all existing tables in database '$DB_NAME'"
log_warning "  2. RESTORE data from the backup"
log_warning "  3. ALL CURRENT DATA WILL BE LOST"
echo ""
read -p "Are you sure you want to continue? (yes/NO) " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Operation cancelled"
    exit 0
fi

# Create a safety backup before restore
log_info "Creating safety backup of current database..."
SAFETY_BACKUP="$BACKUP_DIR/${DB_NAME}_before_restore_$(date +"%Y%m%d_%H%M%S").sql.gz"
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    "$DB_NAME" 2>/dev/null | gzip > "$SAFETY_BACKUP" || log_warning "Could not create safety backup"

# Decompress backup
log_info "Decompressing backup..."
TEMP_SQL="/tmp/hotgigs_restore_$$.sql"
gunzip -c "$SELECTED_BACKUP" > "$TEMP_SQL"

# Restore database
log_info "Restoring database..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$TEMP_SQL"

# Clean up temp file
rm -f "$TEMP_SQL"

log_success "Database restored successfully!"
log_info "Safety backup saved to: $SAFETY_BACKUP"
echo ""

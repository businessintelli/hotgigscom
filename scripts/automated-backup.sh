#!/bin/bash

###############################################################################
# HotGigs Platform - Automated Backup Script
# 
# Runs automated backups (suitable for cron jobs)
# Usage: ./scripts/automated-backup.sh [database|environment|all]
###############################################################################

set -e

# Colors (disabled for cron)
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
else
    GREEN=''
    BLUE=''
    YELLOW=''
    RED=''
    NC=''
fi

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    log_error ".env file not found"
    exit 1
fi

# Get backup type from argument
BACKUP_TYPE="${1:-all}"

# Log file
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup_$(date +"%Y%m%d").log"

# Redirect output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

log_info "╔════════════════════════════════════════════════════╗"
log_info "║       Automated Backup Started                     ║"
log_info "╚════════════════════════════════════════════════════╝"
log_info "Backup type: $BACKUP_TYPE"

# Function to send notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # TODO: Implement notification (email, Slack, etc.)
    # For now, just log
    if [ "$status" = "success" ]; then
        log_success "$message"
    else
        log_error "$message"
    fi
}

# Backup database
backup_database() {
    log_info "Starting database backup..."
    
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
    
    # Generate backup filename
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/hotgigs_auto_${TIMESTAMP}.sql"
    
    # Create backup
    if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        
        # Compress backup
        gzip "$BACKUP_FILE"
        
        BACKUP_SIZE=$(stat -f%z "${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "${BACKUP_FILE}.gz" 2>/dev/null)
        BACKUP_SIZE_MB=$(echo "scale=2; $BACKUP_SIZE / 1024 / 1024" | bc)
        
        log_success "Database backup completed: ${BACKUP_FILE}.gz (${BACKUP_SIZE_MB} MB)"
        send_notification "success" "Database backup completed successfully"
        return 0
    else
        log_error "Database backup failed"
        send_notification "error" "Database backup failed"
        rm -f "$BACKUP_FILE"
        return 1
    fi
}

# Backup environment
backup_environment() {
    log_info "Starting environment backup..."
    
    BACKUP_DIR="backups/environment"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/env_auto_${TIMESTAMP}.json"
    
    # Create JSON backup
    echo "{" > "$BACKUP_FILE"
    echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$BACKUP_FILE"
    echo "  \"description\": \"Automated backup\"," >> "$BACKUP_FILE"
    echo "  \"created_by\": \"automated-script\"," >> "$BACKUP_FILE"
    echo "  \"environment\": {" >> "$BACKUP_FILE"
    
    FIRST=true
    while IFS='=' read -r key value; do
        if [[ $key =~ ^#.*$ ]] || [ -z "$key" ]; then
            continue
        fi
        
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        value=$(echo "$value" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
        
        if [ "$FIRST" = false ]; then
            echo "," >> "$BACKUP_FILE"
        fi
        FIRST=false
        
        echo -n "    \"$key\": \"$value\"" >> "$BACKUP_FILE"
    done < .env
    
    echo "" >> "$BACKUP_FILE"
    echo "  }" >> "$BACKUP_FILE"
    echo "}" >> "$BACKUP_FILE"
    
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
        log_success "Environment backup completed: $BACKUP_FILE ($BACKUP_SIZE bytes)"
        send_notification "success" "Environment backup completed successfully"
        return 0
    else
        log_error "Environment backup failed"
        send_notification "error" "Environment backup failed"
        return 1
    fi
}

# Execute backups based on type
EXIT_CODE=0

case "$BACKUP_TYPE" in
    database)
        backup_database || EXIT_CODE=1
        ;;
    environment)
        backup_environment || EXIT_CODE=1
        ;;
    all)
        backup_database || EXIT_CODE=1
        backup_environment || EXIT_CODE=1
        ;;
    *)
        log_error "Invalid backup type: $BACKUP_TYPE"
        log_info "Usage: $0 [database|environment|all]"
        exit 1
        ;;
esac

log_info "╔════════════════════════════════════════════════════╗"
if [ $EXIT_CODE -eq 0 ]; then
    log_success "║       Automated Backup Completed                   ║"
else
    log_error "║       Automated Backup Failed                      ║"
fi
log_info "╚════════════════════════════════════════════════════╝"

exit $EXIT_CODE

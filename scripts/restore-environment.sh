#!/bin/bash

###############################################################################
# HotGigs Platform - Environment Restore Script
# 
# Restores environment variables from a backup file
# Usage: ./scripts/restore-environment.sh <backup_file>
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

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <backup_file>"
    echo ""
    log_info "Available environment backups:"
    ls -lht backups/environment/*.json 2>/dev/null | grep -v ".meta.json" | head -n 10
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    log_error "jq command not found. Please install jq for JSON parsing."
    log_info "Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

log_warning "╔════════════════════════════════════════════════════╗"
log_warning "║       ENVIRONMENT RESTORE - CAUTION                ║"
log_warning "╚════════════════════════════════════════════════════╝"
echo ""
log_warning "This will OVERWRITE your current .env file!"
log_info "Backup file: $BACKUP_FILE"
echo ""

# Check for metadata file
METADATA_FILE="${BACKUP_FILE%.json}.meta.json"
if [ -f "$METADATA_FILE" ]; then
    log_info "Backup metadata:"
    cat "$METADATA_FILE" | jq -r 'to_entries[] | "  \(.key): \(.value)"'
    echo ""
fi

# Show backup info
log_info "Backup contents:"
TIMESTAMP=$(jq -r '.timestamp' "$BACKUP_FILE")
DESCRIPTION=$(jq -r '.description' "$BACKUP_FILE")
VAR_COUNT=$(jq -r '.environment | length' "$BACKUP_FILE")

log_info "  Created: $TIMESTAMP"
log_info "  Description: $DESCRIPTION"
log_info "  Variables: $VAR_COUNT"
echo ""

# Confirmation prompt
read -p "$(echo -e ${YELLOW}Type 'RESTORE' to confirm:${NC} )" CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    log_info "Restore cancelled"
    exit 0
fi

echo ""
log_info "Starting environment restore..."

# Create a safety backup of current .env
if [ -f .env ]; then
    SAFETY_BACKUP="backups/environment/pre_restore_$(date +"%Y%m%d_%H%M%S").env"
    mkdir -p "backups/environment"
    cp .env "$SAFETY_BACKUP"
    log_success "Safety backup created: $SAFETY_BACKUP"
fi

# Create new .env file from backup
log_info "Restoring environment variables..."

# Extract environment variables from JSON and write to .env
jq -r '.environment | to_entries[] | "\(.key)=\(.value)"' "$BACKUP_FILE" > .env.tmp

if [ $? -ne 0 ]; then
    log_error "Failed to parse backup file"
    
    # Restore safety backup if exists
    if [ -f "$SAFETY_BACKUP" ]; then
        cp "$SAFETY_BACKUP" .env
        log_info "Restored safety backup"
    fi
    
    rm -f .env.tmp
    exit 1
fi

# Replace .env with new file
mv .env.tmp .env

# Count restored variables
RESTORED_COUNT=$(wc -l < .env)

log_success "Environment restored successfully!"
echo ""
log_info "Restore Details:"
log_info "  Source: $BACKUP_FILE"
log_info "  Variables restored: $RESTORED_COUNT"
log_info "  Safety backup: ${SAFETY_BACKUP:-none}"
echo ""

log_warning "⚠️  Important:"
log_warning "  You may need to restart the application for changes to take effect."
log_warning "  Run: pnpm restart"
echo ""

log_success "╔════════════════════════════════════════════════════╗"
log_success "║       Restore completed successfully!              ║"
log_success "╚════════════════════════════════════════════════════╝"

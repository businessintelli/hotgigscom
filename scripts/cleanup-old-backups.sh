#!/bin/bash

###############################################################################
# HotGigs Platform - Cleanup Old Backups Script
# 
# Removes backups older than retention period
# Usage: ./scripts/cleanup-old-backups.sh [retention_days]
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

# Get retention days from argument or use default
RETENTION_DAYS="${1:-30}"

log_info "╔════════════════════════════════════════════════════╗"
log_info "║       Backup Cleanup                               ║"
log_info "╚════════════════════════════════════════════════════╝"
echo ""
log_info "Retention period: $RETENTION_DAYS days"
log_info "Backups older than $(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d' 2>/dev/null || date -v-${RETENTION_DAYS}d '+%Y-%m-%d' 2>/dev/null) will be deleted"
echo ""

# Function to cleanup backups in a directory
cleanup_directory() {
    local dir=$1
    local type=$2
    
    if [ ! -d "$dir" ]; then
        log_warning "Directory not found: $dir"
        return 0
    fi
    
    log_info "Cleaning up $type backups in $dir..."
    
    # Find files older than retention period
    local old_files=$(find "$dir" -type f -mtime +$RETENTION_DAYS 2>/dev/null)
    local count=$(echo "$old_files" | grep -c . || echo 0)
    
    if [ "$count" -eq 0 ]; then
        log_info "No old $type backups to delete"
        return 0
    fi
    
    log_warning "Found $count old $type backup(s) to delete:"
    echo "$old_files" | while read -r file; do
        if [ -n "$file" ]; then
            local size=$(du -h "$file" | cut -f1)
            local age=$(find "$file" -mtime +$RETENTION_DAYS -printf '%TY-%Tm-%Td\n' 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null)
            log_info "  - $(basename "$file") ($size, created: $age)"
        fi
    done
    echo ""
    
    # Ask for confirmation
    read -p "$(echo -e ${YELLOW}Delete these $count file(s)? [y/N]:${NC} )" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local deleted=0
        local freed_space=0
        
        echo "$old_files" | while read -r file; do
            if [ -n "$file" ] && [ -f "$file" ]; then
                local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                rm -f "$file"
                deleted=$((deleted + 1))
                freed_space=$((freed_space + file_size))
            fi
        done
        
        local freed_mb=$(echo "scale=2; $freed_space / 1024 / 1024" | bc 2>/dev/null || echo "0")
        log_success "Deleted $count $type backup(s), freed ${freed_mb} MB"
    else
        log_info "Cleanup cancelled"
    fi
    
    echo ""
}

# Cleanup database backups
cleanup_directory "backups/database" "database"

# Cleanup environment backups
cleanup_directory "backups/environment" "environment"

# Show remaining backups
log_info "Remaining backups:"
echo ""

if [ -d "backups/database" ]; then
    DB_COUNT=$(find backups/database -type f | wc -l)
    DB_SIZE=$(du -sh backups/database 2>/dev/null | cut -f1)
    log_info "Database backups: $DB_COUNT files ($DB_SIZE)"
fi

if [ -d "backups/environment" ]; then
    ENV_COUNT=$(find backups/environment -type f | wc -l)
    ENV_SIZE=$(du -sh backups/environment 2>/dev/null | cut -f1)
    log_info "Environment backups: $ENV_COUNT files ($ENV_SIZE)"
fi

echo ""
log_success "╔════════════════════════════════════════════════════╗"
log_success "║       Cleanup completed!                           ║"
log_success "╚════════════════════════════════════════════════════╝"

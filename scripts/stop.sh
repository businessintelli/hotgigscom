#!/bin/bash

###############################################################################
# HotGigs Platform - Stop Script
# 
# Gracefully stops the HotGigs application
###############################################################################

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

log_info "Stopping HotGigs Platform..."

# Find Node.js processes running the application
PIDS=$(ps aux | grep -E "node.*hotgigs|tsx.*server" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    log_warning "No running HotGigs processes found"
    exit 0
fi

log_info "Found running processes: $PIDS"

# Try graceful shutdown first
for PID in $PIDS; do
    log_info "Sending SIGTERM to process $PID..."
    kill -TERM $PID 2>/dev/null || true
done

# Wait for processes to stop
log_info "Waiting for processes to stop gracefully (max 10 seconds)..."
COUNTER=0
while [ $COUNTER -lt 10 ]; do
    REMAINING=$(ps aux | grep -E "node.*hotgigs|tsx.*server" | grep -v grep | wc -l)
    if [ "$REMAINING" -eq 0 ]; then
        log_success "All processes stopped gracefully"
        exit 0
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
done

# Force kill if still running
log_warning "Some processes did not stop gracefully. Force killing..."
for PID in $PIDS; do
    kill -9 $PID 2>/dev/null || true
done

log_success "HotGigs Platform stopped"

#!/bin/bash

###############################################################################
# HotGigs Platform - Restart Script
# 
# Restarts the HotGigs application
###############################################################################

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info "Restarting HotGigs Platform..."

# Stop the application
"$SCRIPT_DIR/stop.sh"

# Wait a moment
sleep 2

# Start the application
MODE="${1:-production}"
"$SCRIPT_DIR/start.sh" "$MODE"

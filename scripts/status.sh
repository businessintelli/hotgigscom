#!/bin/bash

###############################################################################
# HotGigs Platform - Status Script
# 
# Checks the status and health of the HotGigs application
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

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  HotGigs Platform - System Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if application is running
log_info "Checking application processes..."
PIDS=$(ps aux | grep -E "node.*hotgigs|tsx.*server" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    log_error "Application is NOT running"
    APP_RUNNING=false
else
    log_success "Application is running (PIDs: $PIDS)"
    APP_RUNNING=true
    
    # Show process details
    echo ""
    log_info "Process details:"
    ps aux | grep -E "node.*hotgigs|tsx.*server" | grep -v grep | awk '{printf "  PID: %-8s CPU: %-6s MEM: %-6s COMMAND: %s\n", $2, $3"%", $4"%", substr($0, index($0,$11))}'
fi

# Check port 3000
echo ""
log_info "Checking port 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    log_success "Port 3000 is open and listening"
    PORT_PID=$(lsof -Pi :3000 -sTCP:LISTEN -t)
    log_info "Process on port 3000: PID $PORT_PID"
else
    log_warning "Port 3000 is not listening"
fi

# Check database connection
echo ""
log_info "Checking database connection..."
if command -v mysql &> /dev/null; then
    # Extract database credentials from .env if it exists
    if [ -f .env ]; then
        DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2-)
        if [ ! -z "$DB_URL" ]; then
            # Parse MySQL URL (mysql://user:pass@host:port/db)
            DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
            DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
            
            if [ -z "$DB_PORT" ]; then
                DB_PORT=3306
            fi
            
            if mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" --silent 2>/dev/null; then
                log_success "Database server is reachable at $DB_HOST:$DB_PORT"
                
                # Check if database exists (requires credentials)
                if [ ! -z "$DB_NAME" ]; then
                    log_info "Database name: $DB_NAME"
                fi
            else
                log_warning "Cannot reach database server at $DB_HOST:$DB_PORT"
            fi
        else
            log_warning "DATABASE_URL not found in .env"
        fi
    else
        log_warning ".env file not found"
    fi
else
    log_warning "MySQL client not installed, skipping database check"
fi

# Check disk space
echo ""
log_info "Checking disk space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log_error "Disk usage is critical: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "Disk usage is high: ${DISK_USAGE}%"
else
    log_success "Disk usage is healthy: ${DISK_USAGE}%"
fi

# Check memory usage
echo ""
log_info "Checking memory usage..."
if command -v free &> /dev/null; then
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$MEM_USAGE" -gt 90 ]; then
        log_error "Memory usage is critical: ${MEM_USAGE}%"
    elif [ "$MEM_USAGE" -gt 80 ]; then
        log_warning "Memory usage is high: ${MEM_USAGE}%"
    else
        log_success "Memory usage is healthy: ${MEM_USAGE}%"
    fi
else
    log_warning "Cannot check memory usage (free command not available)"
fi

# Check Node.js version
echo ""
log_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js version: $NODE_VERSION"
else
    log_error "Node.js is not installed"
fi

# Check pnpm version
echo ""
log_info "Checking pnpm version..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm version: $PNPM_VERSION"
else
    log_error "pnpm is not installed"
fi

# System uptime
echo ""
log_info "System uptime:"
uptime

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$APP_RUNNING" = true ]; then
    log_success "Overall Status: HEALTHY"
else
    log_error "Overall Status: DOWN"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

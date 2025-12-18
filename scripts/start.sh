#!/bin/bash

###############################################################################
# HotGigs Platform - Start Script
# 
# Starts the HotGigs application in production or development mode
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if .env exists
if [ ! -f .env ]; then
    log_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warning "Please configure .env before starting"
        exit 1
    else
        log_warning "No .env.example found either. Please create .env manually"
        exit 1
    fi
fi

# Parse command line arguments
MODE="${1:-production}"

case "$MODE" in
    dev|development)
        log_info "Starting HotGigs in DEVELOPMENT mode..."
        export NODE_ENV=development
        pnpm dev
        ;;
    
    prod|production)
        log_info "Starting HotGigs in PRODUCTION mode..."
        export NODE_ENV=production
        
        # Check if build exists
        if [ ! -d "dist" ]; then
            log_info "Build directory not found. Building application..."
            pnpm build
        fi
        
        pnpm start
        ;;
    
    *)
        echo "Usage: $0 [dev|development|prod|production]"
        echo ""
        echo "Examples:"
        echo "  $0 dev          # Start in development mode with hot reload"
        echo "  $0 production   # Start in production mode"
        exit 1
        ;;
esac

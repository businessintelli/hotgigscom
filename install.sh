#!/bin/bash

# =============================================================================
# HotGigs Platform - Installation Script
# =============================================================================
# This script installs all dependencies and sets up the development environment
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}HotGigs Platform - Installation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 22 or higher from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing pnpm...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✓${NC} pnpm $(pnpm -v) detected"

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created"
        echo -e "${YELLOW}⚠${NC}  Please update .env with your actual configuration"
    else
        echo -e "${YELLOW}⚠${NC}  .env.example not found, skipping .env creation"
    fi
fi

# Setup database (if using Docker)
echo ""
echo -e "${YELLOW}Do you want to start the database using Docker? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker from https://www.docker.com/"
    else
        echo -e "${YELLOW}Starting database with Docker Compose...${NC}"
        docker-compose up -d mysql redis
        echo -e "${GREEN}✓${NC} Database services started"
        
        echo -e "${YELLOW}Waiting for database to be ready...${NC}"
        sleep 10
        
        # Run database migrations
        echo -e "${YELLOW}Running database migrations...${NC}"
        pnpm db:push
        echo -e "${GREEN}✓${NC} Database migrations completed"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Update ${YELLOW}.env${NC} file with your configuration"
echo -e "  2. Run ${YELLOW}pnpm dev${NC} to start the development server"
echo -e "  3. Visit ${YELLOW}http://localhost:3000${NC} in your browser"
echo ""
echo -e "For production deployment:"
echo -e "  - Run ${YELLOW}pnpm build${NC} to build the application"
echo -e "  - Run ${YELLOW}pnpm start${NC} to start the production server"
echo -e "  - Or use ${YELLOW}docker-compose up${NC} for containerized deployment"
echo ""

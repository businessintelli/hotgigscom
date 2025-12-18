#!/bin/bash

###############################################################################
# HotGigs Platform - Database Initialization Script
# 
# Creates database from scratch and runs all migrations
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

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║  HotGigs Database Initialization             ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found"
    log_info "Please create .env file with DATABASE_URL configuration"
    exit 1
fi

# Extract database configuration from .env
DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2-)

if [ -z "$DB_URL" ]; then
    log_error "DATABASE_URL not found in .env"
    exit 1
fi

# Parse MySQL URL (mysql://user:pass@host:port/db)
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_PORT" ]; then
    DB_PORT=3306
fi

log_info "Database Configuration:"
log_info "  Host: $DB_HOST"
log_info "  Port: $DB_PORT"
log_info "  Database: $DB_NAME"
log_info "  User: $DB_USER"
echo ""

# Check if MySQL is accessible
log_info "Checking MySQL connection..."
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" >/dev/null 2>&1; then
    log_error "Cannot connect to MySQL server"
    log_info "Please check your DATABASE_URL configuration"
    exit 1
fi
log_success "MySQL connection successful"

# Ask for confirmation
echo ""
log_warning "This will:"
log_warning "  1. DROP the existing database '$DB_NAME' if it exists"
log_warning "  2. CREATE a new database '$DB_NAME'"
log_warning "  3. Run all migrations"
echo ""
read -p "Are you sure you want to continue? (yes/NO) " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Operation cancelled"
    exit 0
fi

# Drop existing database
log_info "Dropping existing database..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;" 2>/dev/null || true
log_success "Database dropped"

# Create new database
log_info "Creating new database..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
log_success "Database created: $DB_NAME"

# Run migrations using Drizzle
log_info "Running database migrations..."
pnpm db:push
log_success "Migrations completed"

# Optional: Seed data
if [ -f "scripts/db-seed.sh" ]; then
    echo ""
    read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Seeding database..."
        ./scripts/db-seed.sh
    fi
fi

echo ""
log_success "╔════════════════════════════════════════════════════════════╗"
log_success "║  Database initialization completed successfully!          ║"
log_success "╚════════════════════════════════════════════════════════════╝"
echo ""

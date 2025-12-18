#!/bin/bash

###############################################################################
# HotGigs Platform - Interactive Setup Wizard
# 
# Guides users through the complete setup process
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

clear

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ╦ ╦╔═╗╔╦╗╔═╗╦╔═╗╔═╗                                        ║
║   ╠═╣║ ║ ║ ║ ╦║║ ╦╚═╗                                        ║
║   ╩ ╩╚═╝ ╩ ╚═╝╩╚═╝╚═╝                                        ║
║                                                               ║
║   AI-Powered Recruitment Platform                            ║
║   Interactive Setup Wizard                                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log_info "Welcome to the HotGigs Platform Setup Wizard!"
log_info "This wizard will guide you through the installation and configuration process."
echo ""
sleep 2

# Step 1: Deployment Type
log_step "Step 1/7: Choose Deployment Type"
echo ""
echo "  1) Local Development (for testing and development)"
echo "  2) Cloud Production (for deployment on cloud servers)"
echo "  3) Docker Container (containerized deployment)"
echo ""
read -p "Select deployment type [1-3]: " DEPLOY_TYPE

case "$DEPLOY_TYPE" in
    1)
        ENVIRONMENT="development"
        log_info "Selected: Local Development"
        ;;
    2)
        ENVIRONMENT="production"
        log_info "Selected: Cloud Production"
        ;;
    3)
        ENVIRONMENT="docker"
        log_info "Selected: Docker Container"
        ;;
    *)
        log_error "Invalid selection"
        exit 1
        ;;
esac

echo ""
sleep 1

# Step 2: Database Configuration
log_step "Step 2/7: Database Configuration"
echo ""

read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "Database name [hotgigs]: " DB_NAME
DB_NAME=${DB_NAME:-hotgigs}

read -p "Database user [hotgigs]: " DB_USER
DB_USER=${DB_USER:-hotgigs}

read -sp "Database password: " DB_PASS
echo ""

DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

log_success "Database configuration saved"
echo ""
sleep 1

# Step 3: Application Configuration
log_step "Step 3/7: Application Configuration"
echo ""

read -p "Application port [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

read -p "Application title [HotGigs - AI-Powered Recruitment]: " APP_TITLE
APP_TITLE=${APP_TITLE:-"HotGigs - AI-Powered Recruitment"}

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
log_info "Generated secure JWT secret"

log_success "Application configuration saved"
echo ""
sleep 1

# Step 4: Manus OAuth Configuration
log_step "Step 4/7: Manus OAuth Configuration"
echo ""
log_info "You'll need Manus OAuth credentials from https://portal.manus.im"
echo ""

read -p "Manus App ID: " MANUS_APP_ID

read -sp "Manus API Key (server-side): " MANUS_API_KEY
echo ""

read -sp "Manus API Key (frontend): " MANUS_FRONTEND_API_KEY
echo ""

read -p "OAuth Server URL [https://api.manus.im]: " OAUTH_SERVER_URL
OAUTH_SERVER_URL=${OAUTH_SERVER_URL:-"https://api.manus.im"}

read -p "OAuth Portal URL [https://portal.manus.im]: " OAUTH_PORTAL_URL
OAUTH_PORTAL_URL=${OAUTH_PORTAL_URL:-"https://portal.manus.im"}

log_success "OAuth configuration saved"
echo ""
sleep 1

# Step 5: Email Configuration (Optional)
log_step "Step 5/7: Email Configuration (Optional)"
echo ""
echo "HotGigs supports Resend and SendGrid for email notifications"
read -p "Do you want to configure email now? (y/N): " CONFIGURE_EMAIL

if [[ $CONFIGURE_EMAIL =~ ^[Yy]$ ]]; then
    echo ""
    echo "  1) Resend"
    echo "  2) SendGrid"
    echo "  3) Skip"
    read -p "Select email provider [1-3]: " EMAIL_PROVIDER
    
    case "$EMAIL_PROVIDER" in
        1)
            read -p "Resend API Key: " RESEND_API_KEY
            SENDGRID_API_KEY=""
            ;;
        2)
            read -p "SendGrid API Key: " SENDGRID_API_KEY
            RESEND_API_KEY=""
            ;;
        *)
            RESEND_API_KEY=""
            SENDGRID_API_KEY=""
            ;;
    esac
else
    RESEND_API_KEY=""
    SENDGRID_API_KEY=""
fi

log_success "Email configuration saved"
echo ""
sleep 1

# Step 6: Create .env file
log_step "Step 6/7: Creating Configuration Files"
echo ""

log_info "Writing .env file..."

cat > .env << EOF
# Environment
NODE_ENV=$ENVIRONMENT
PORT=$APP_PORT

# Database
DATABASE_URL=$DATABASE_URL

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Manus OAuth
VITE_APP_ID=$MANUS_APP_ID
OAUTH_SERVER_URL=$OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL=$OAUTH_PORTAL_URL

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=$OAUTH_SERVER_URL
BUILT_IN_FORGE_API_KEY=$MANUS_API_KEY
VITE_FRONTEND_FORGE_API_KEY=$MANUS_FRONTEND_API_KEY
VITE_FRONTEND_FORGE_API_URL=$OAUTH_SERVER_URL

# Application Branding
VITE_APP_TITLE=$APP_TITLE
VITE_APP_LOGO=/logo.png

# Email (Optional)
RESEND_API_KEY=$RESEND_API_KEY
SENDGRID_API_KEY=$SENDGRID_API_KEY

# Owner Info (will be set by Manus platform)
OWNER_OPEN_ID=
OWNER_NAME=

# Analytics (will be set by Manus platform)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
EOF

log_success ".env file created"
echo ""
sleep 1

# Step 7: Installation
log_step "Step 7/7: Installing Dependencies and Setting Up Database"
echo ""

if [ "$DEPLOY_TYPE" = "3" ]; then
    log_info "Docker deployment selected"
    log_info "Please run: docker-compose up -d"
else
    read -p "Do you want to install dependencies now? (Y/n): " INSTALL_DEPS
    
    if [[ ! $INSTALL_DEPS =~ ^[Nn]$ ]]; then
        log_info "Installing dependencies..."
        pnpm install
        log_success "Dependencies installed"
        echo ""
        
        read -p "Do you want to initialize the database now? (Y/n): " INIT_DB
        
        if [[ ! $INIT_DB =~ ^[Nn]$ ]]; then
            log_info "Testing database connection..."
            
            if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" >/dev/null 2>&1; then
                log_success "Database connection successful"
                
                log_info "Creating database if it doesn't exist..."
                mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
                
                log_info "Running migrations..."
                pnpm db:push
                
                log_success "Database initialized"
            else
                log_error "Cannot connect to database"
                log_warning "Please check your database configuration and run: pnpm db:push"
            fi
        fi
    fi
fi

# Summary
clear
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✓ Setup Complete!                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
log_success "HotGigs Platform has been configured successfully!"
echo ""
log_info "Configuration Summary:"
echo "  • Environment: $ENVIRONMENT"
echo "  • Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "  • Application Port: $APP_PORT"
echo "  • OAuth: Configured"
echo ""
log_info "Next Steps:"
echo ""

if [ "$ENVIRONMENT" = "development" ]; then
    echo "  1. Start the development server:"
    echo "     ${CYAN}pnpm dev${NC}"
    echo ""
    echo "  2. Open your browser to:"
    echo "     ${CYAN}http://localhost:$APP_PORT${NC}"
elif [ "$ENVIRONMENT" = "docker" ]; then
    echo "  1. Build and start Docker containers:"
    echo "     ${CYAN}docker-compose up -d${NC}"
    echo ""
    echo "  2. View logs:"
    echo "     ${CYAN}docker-compose logs -f${NC}"
else
    echo "  1. Build the application:"
    echo "     ${CYAN}pnpm build${NC}"
    echo ""
    echo "  2. Start the production server:"
    echo "     ${CYAN}pnpm start${NC}"
    echo ""
    echo "  3. Or use the control scripts:"
    echo "     ${CYAN}./scripts/start.sh production${NC}"
fi

echo ""
log_info "For more information, see README.md"
echo ""
log_info "Need help? Visit: https://docs.hotgigs.com"
echo ""

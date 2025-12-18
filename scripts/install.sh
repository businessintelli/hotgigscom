#!/bin/bash

###############################################################################
# HotGigs Platform - Installation Script
# 
# This script installs and configures the HotGigs recruitment platform
# Supports both local development and cloud deployment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Banner
echo -e "${BLUE}"
cat << "EOF"
╦ ╦╔═╗╔╦╗╔═╗╦╔═╗╔═╗
╠═╣║ ║ ║ ║ ╦║║ ╦╚═╗
╩ ╩╚═╝ ╩ ╚═╝╩╚═╝╚═╝
AI-Powered Recruitment Platform
EOF
echo -e "${NC}"

log_info "Starting HotGigs Platform installation..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log_warning "Running as root. It's recommended to run as a regular user with sudo privileges."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Detect OS
log_info "Detecting operating system..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        log_info "Detected: $PRETTY_NAME"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    log_info "Detected: macOS"
else
    log_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Check Node.js
log_info "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js $NODE_VERSION is installed"
    
    # Check version (requires 20.x or higher)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        log_error "Node.js 20.x or higher is required. Current version: $NODE_VERSION"
        log_info "Please upgrade Node.js: https://nodejs.org/"
        exit 1
    fi
else
    log_error "Node.js is not installed"
    log_info "Installing Node.js..."
    
    if [ "$OS" == "linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install node@22
        else
            log_error "Homebrew is not installed. Please install from https://brew.sh/"
            exit 1
        fi
    fi
    
    log_success "Node.js installed successfully"
fi

# Check pnpm
log_info "Checking pnpm installation..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm $PNPM_VERSION is installed"
else
    log_info "Installing pnpm..."
    npm install -g pnpm
    log_success "pnpm installed successfully"
fi

# Check Git
log_info "Checking Git installation..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_success "$GIT_VERSION is installed"
else
    log_error "Git is not installed"
    log_info "Installing Git..."
    
    if [ "$OS" == "linux" ]; then
        sudo apt-get update
        sudo apt-get install -y git
    elif [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install git
        fi
    fi
    
    log_success "Git installed successfully"
fi

# Check MySQL/MariaDB
log_info "Checking database installation..."
DB_INSTALLED=false

if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    log_success "MySQL is installed: $MYSQL_VERSION"
    DB_INSTALLED=true
elif command -v mariadb &> /dev/null; then
    MARIADB_VERSION=$(mariadb --version)
    log_success "MariaDB is installed: $MARIADB_VERSION"
    DB_INSTALLED=true
fi

if [ "$DB_INSTALLED" = false ]; then
    log_warning "No database server detected"
    echo "HotGigs requires MySQL 8.0+ or MariaDB 10.5+"
    read -p "Install MySQL now? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$OS" == "linux" ]; then
            if [ "$DISTRO" == "ubuntu" ] || [ "$DISTRO" == "debian" ]; then
                sudo apt-get update
                sudo apt-get install -y mysql-server
                sudo systemctl start mysql
                sudo systemctl enable mysql
            elif [ "$DISTRO" == "centos" ] || [ "$DISTRO" == "rhel" ] || [ "$DISTRO" == "fedora" ]; then
                sudo yum install -y mysql-server
                sudo systemctl start mysqld
                sudo systemctl enable mysqld
            fi
        elif [ "$OS" == "macos" ]; then
            brew install mysql
            brew services start mysql
        fi
        
        log_success "MySQL installed successfully"
        log_warning "Run 'mysql_secure_installation' to secure your MySQL installation"
    else
        log_warning "Skipping database installation. You'll need to configure DATABASE_URL manually."
    fi
fi

# Install dependencies
log_info "Installing project dependencies..."
pnpm install
log_success "Dependencies installed successfully"

# Setup environment file
log_info "Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        log_success "Created .env from .env.example"
        log_warning "Please edit .env and configure your environment variables"
    else
        log_warning "No .env.example found. Creating minimal .env file..."
        cat > .env << EOF
# Database
DATABASE_URL=mysql://hotgigs:password@localhost:3306/hotgigs

# JWT Secret (change this!)
JWT_SECRET=$(openssl rand -base64 32)

# OAuth (configure with your Manus OAuth credentials)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Application
NODE_ENV=development
PORT=3000

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Email (optional)
RESEND_API_KEY=
SENDGRID_API_KEY=

# App Branding
VITE_APP_TITLE=HotGigs - AI-Powered Recruitment
VITE_APP_LOGO=/logo.png
EOF
        log_success "Created minimal .env file"
    fi
    
    log_warning "IMPORTANT: Edit .env and configure your environment variables before starting the application"
else
    log_info ".env file already exists"
fi

# Database setup
log_info "Setting up database..."
read -p "Do you want to create the database and run migrations now? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Please enter your MySQL root password when prompted..."
    
    # Extract database name from DATABASE_URL in .env
    DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4 | cut -d'?' -f1)
    if [ -z "$DB_NAME" ]; then
        DB_NAME="hotgigs"
    fi
    
    log_info "Creating database: $DB_NAME"
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    log_info "Running database migrations..."
    pnpm db:push
    
    log_success "Database setup complete"
else
    log_warning "Skipping database setup. Run 'pnpm db:push' manually when ready."
fi

# Build application
log_info "Building application..."
pnpm build || log_warning "Build step not configured or failed"

# Create systemd service (Linux only)
if [ "$OS" == "linux" ]; then
    read -p "Do you want to create a systemd service for auto-start? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SERVICE_FILE="/etc/systemd/system/hotgigs.service"
        INSTALL_DIR=$(pwd)
        CURRENT_USER=$(whoami)
        
        sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=HotGigs AI-Powered Recruitment Platform
After=network.target mysql.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
ExecStart=$(which pnpm) start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable hotgigs
        
        log_success "Systemd service created: $SERVICE_FILE"
        log_info "Use 'sudo systemctl start hotgigs' to start the service"
    fi
fi

# Installation complete
echo ""
log_success "╔════════════════════════════════════════════════════════════╗"
log_success "║  HotGigs Platform installation completed successfully!    ║"
log_success "╚════════════════════════════════════════════════════════════╝"
echo ""
log_info "Next steps:"
echo "  1. Edit .env and configure your environment variables"
echo "  2. Run database migrations: pnpm db:push"
echo "  3. Start the development server: pnpm dev"
echo "  4. Or start in production mode: pnpm start"
echo ""
log_info "For more information, see README.md"
echo ""

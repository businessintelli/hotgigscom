# HotGigs Platform - Standalone Server Setup Guide

This comprehensive guide provides step-by-step instructions for deploying the HotGigs AI-Powered Recruitment Platform on a standalone server, whether it's a dedicated server, VPS, or on-premises infrastructure.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Process Management](#process-management)
7. [Reverse Proxy Setup](#reverse-proxy-setup)
8. [SSL Configuration](#ssl-configuration)
9. [Maintenance and Monitoring](#maintenance-and-monitoring)

---

## System Requirements

### Minimum Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Supported Operating Systems

| OS | Version | Status |
|----|---------|--------|
| Ubuntu | 22.04 LTS, 24.04 LTS | Recommended |
| Debian | 11, 12 | Supported |
| CentOS/RHEL | 8, 9 | Supported |
| Amazon Linux | 2, 2023 | Supported |

---

## Prerequisites Installation

### Step 1: Update System Packages

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget git
```

### Step 2: Install Node.js 22.x

The application requires Node.js version 22.x or higher.

**Using NodeSource (Recommended):**
```bash
# Download and run NodeSource setup script
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should output v22.x.x
npm --version   # Should output 10.x.x
```

**Using NVM (Alternative):**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# Verify installation
node --version
```

### Step 3: Install pnpm Package Manager

```bash
# Install pnpm globally
npm install -g pnpm@10.4.1

# Verify installation
pnpm --version  # Should output 10.4.1
```

### Step 4: Install Additional Dependencies

```bash
# Install required system libraries
sudo apt install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libvips-dev
```

---

## Database Setup

HotGigs requires MySQL 8.0+ or TiDB as the database backend.

### Option A: MySQL 8.0 Installation

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -u root -p << EOF
CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hotgigs'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hotgigs.* TO 'hotgigs'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Option B: TiDB Cloud (Recommended for Production)

TiDB provides a MySQL-compatible distributed database with automatic scaling.

1. Create an account at [TiDB Cloud](https://tidbcloud.com)
2. Create a new cluster (Serverless tier available for free)
3. Note the connection string provided in the dashboard

### Database Connection String Format

```
mysql://username:password@host:port/database?ssl=true
```

Example:
```
mysql://hotgigs:your_secure_password@localhost:3306/hotgigs
```

---

## Application Deployment

### Step 1: Clone the Repository

```bash
# Create application directory
sudo mkdir -p /opt/hotgigs
sudo chown $USER:$USER /opt/hotgigs

# Clone the repository
cd /opt/hotgigs
git clone https://github.com/businessintelli/hotgigscom.git .
```

### Step 2: Install Dependencies

```bash
cd /opt/hotgigs

# Install all dependencies
pnpm install

# This will install all packages listed in package.json including:
# - React 19.1.1
# - Express 4.21.2
# - tRPC 11.6.0
# - Drizzle ORM 0.44.5
# - And 90+ other dependencies
```

### Step 3: Build the Application

```bash
# Build for production
pnpm build

# This creates:
# - dist/index.js (server bundle)
# - dist/client/ (frontend assets)
```

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

### Step 2: Required Environment Variables

Create a `.env` file with the following variables:

```bash
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL="mysql://hotgigs:password@localhost:3306/hotgigs"

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"

# ===========================================
# APPLICATION SETTINGS
# ===========================================
NODE_ENV="production"
PORT=3000
VITE_APP_ID="hotgigs-production"
VITE_APP_TITLE="HotGigs - AI-Powered Recruitment Platform"
VITE_APP_LOGO="/logo.svg"

# ===========================================
# OAUTH CONFIGURATION (if using Manus OAuth)
# ===========================================
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/portal"

# ===========================================
# EMAIL SERVICE (choose one)
# ===========================================
# Option 1: Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Option 2: SendGrid
SENDGRID_API_KEY="SG.xxxxxxxxxxxx"

# ===========================================
# AI/LLM INTEGRATION
# ===========================================
BUILT_IN_FORGE_API_URL="https://api.openai.com/v1"
BUILT_IN_FORGE_API_KEY="sk-xxxxxxxxxxxx"
VITE_FRONTEND_FORGE_API_URL="https://api.openai.com/v1"
VITE_FRONTEND_FORGE_API_KEY="sk-xxxxxxxxxxxx"

# ===========================================
# FILE STORAGE (S3-compatible)
# ===========================================
S3_BUCKET="hotgigs-storage"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_ENDPOINT="https://s3.amazonaws.com"  # Or MinIO endpoint

# ===========================================
# OWNER CONFIGURATION
# ===========================================
OWNER_OPEN_ID="owner-user-id"
OWNER_NAME="Admin"
```

### Step 3: Initialize Database Schema

```bash
# Generate and apply database migrations
pnpm db:push

# (Optional) Seed demo data
pnpm db:seed
```

---

## Process Management

### Using PM2 (Recommended)

PM2 is a production process manager for Node.js applications.

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'hotgigs',
    script: 'dist/index.js',
    cwd: '/opt/hotgigs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env',
    max_memory_restart: '1G',
    error_file: '/var/log/hotgigs/error.log',
    out_file: '/var/log/hotgigs/out.log',
    merge_logs: true,
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/hotgigs
sudo chown $USER:$USER /var/log/hotgigs

# Start the application
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions output by this command
```

### Using systemd (Alternative)

```bash
# Create systemd service file
sudo cat > /etc/systemd/system/hotgigs.service << 'EOF'
[Unit]
Description=HotGigs AI Recruitment Platform
After=network.target mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/hotgigs
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hotgigs
Environment=NODE_ENV=production
EnvironmentFile=/opt/hotgigs/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable hotgigs
sudo systemctl start hotgigs

# Check status
sudo systemctl status hotgigs
```

---

## Reverse Proxy Setup

### Using Nginx (Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/hotgigs << 'EOF'
upstream hotgigs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Client body size for file uploads
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://hotgigs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://hotgigs_backend;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/hotgigs /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## Maintenance and Monitoring

### Log Management

```bash
# View application logs (PM2)
pm2 logs hotgigs

# View application logs (systemd)
sudo journalctl -u hotgigs -f

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Check application status
curl -I http://localhost:3000/

# Check PM2 status
pm2 status

# Check system resources
htop
```

### Backup Strategy

```bash
# Database backup script
cat > /opt/hotgigs/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/hotgigs/backups"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u hotgigs -p'password' hotgigs > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
EOF

chmod +x /opt/hotgigs/backup.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/hotgigs/backup.sh") | crontab -
```

### Update Procedure

```bash
# Pull latest changes
cd /opt/hotgigs
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild application
pnpm build

# Apply database migrations
pnpm db:push

# Restart application
pm2 restart hotgigs
# OR
sudo systemctl restart hotgigs
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `sudo lsof -i :3000` and kill the process |
| Database connection failed | Check DATABASE_URL and MySQL service status |
| Permission denied | Ensure correct file ownership with `chown` |
| Out of memory | Increase server RAM or adjust PM2 memory limits |
| SSL certificate errors | Renew with `sudo certbot renew` |

### Getting Help

For additional support, please refer to:
- GitHub Issues: https://github.com/businessintelli/hotgigscom/issues
- Documentation: https://github.com/businessintelli/hotgigscom/docs

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

# HotGigs Platform - Installation Guide

Complete guide for installing and deploying the HotGigs AI-Powered Recruitment Platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Deployment Options](#deployment-options)
7. [Control Scripts](#control-scripts)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+) or macOS 12+
- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **Database**: MySQL 8.0+ or MariaDB 10.5+
- **Memory**: Minimum 2GB RAM (4GB+ recommended for production)
- **Disk Space**: Minimum 1GB free space

### Required Software

```bash
# Node.js 20+ (check version)
node --version

# pnpm (check version)
pnpm --version

# MySQL/MariaDB (check version)
mysql --version

# Git (check version)
git --version
```

If any of these are missing, the installation script will guide you through installing them.

---

## Quick Start

### Option 1: Interactive Setup Wizard (Recommended)

The easiest way to get started:

```bash
# Clone the repository
git clone https://github.com/your-org/hotgigs-platform.git
cd hotgigs-platform

# Run the setup wizard
./scripts/setup-wizard.sh
```

The wizard will guide you through:
- Choosing deployment type (local/cloud/docker)
- Configuring database connection
- Setting up OAuth credentials
- Installing dependencies
- Initializing the database

### Option 2: Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hotgigs-platform.git
cd hotgigs-platform

# 2. Run the installation script
./scripts/install.sh

# 3. Configure environment variables
cp .env.example .env
nano .env  # Edit with your configuration

# 4. Install dependencies
pnpm install

# 5. Initialize database
pnpm db:push

# 6. Start the application
pnpm dev  # Development mode
# OR
pnpm start  # Production mode
```

---

## Installation Methods

### Local Development

Perfect for testing and development:

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Access at http://localhost:3000
```

### Cloud Production

For deployment on cloud servers (AWS, Google Cloud, Azure, DigitalOcean, etc.):

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

### Docker Container

Containerized deployment:

```bash
# Build Docker image
docker build -t hotgigs-platform .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name hotgigs \
  hotgigs-platform

# Or use Docker Compose
docker-compose up -d
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following configuration:

```bash
# Environment
NODE_ENV=production  # development | production
PORT=3000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/hotgigs

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters

# Manus OAuth
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-server-side-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Application Branding
VITE_APP_TITLE=HotGigs - AI-Powered Recruitment
VITE_APP_LOGO=/logo.png

# Email (Optional)
RESEND_API_KEY=your-resend-api-key
SENDGRID_API_KEY=your-sendgrid-api-key

# Owner Info (set by platform)
OWNER_OPEN_ID=
OWNER_NAME=

# Analytics (set by platform)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### Obtaining Manus OAuth Credentials

1. Visit [Manus Portal](https://portal.manus.im)
2. Create a new application
3. Copy the App ID and API keys
4. Add them to your `.env` file

---

## Database Setup

### Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user and grant permissions
CREATE USER 'hotgigs'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON hotgigs.* TO 'hotgigs'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Migrations

```bash
# Push schema to database
pnpm db:push

# Or use the database initialization script
./scripts/db-init.sh
```

### Database Management Scripts

```bash
# Initialize database from scratch
./scripts/db-init.sh

# Create backup
./scripts/db-backup.sh

# Restore from backup
./scripts/db-restore.sh
```

Backups are stored in the `backups/` directory with timestamps.

---

## Deployment Options

### Systemd Service (Linux)

Create a systemd service for automatic startup:

```bash
# Create service file
sudo nano /etc/systemd/system/hotgigs.service
```

```ini
[Unit]
Description=HotGigs AI-Powered Recruitment Platform
After=network.target mysql.service

[Service]
Type=simple
User=hotgigs
WorkingDirectory=/opt/hotgigs-platform
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable hotgigs
sudo systemctl start hotgigs

# Check status
sudo systemctl status hotgigs
```

### PM2 Process Manager

Alternative process manager:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "hotgigs" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Nginx Reverse Proxy

Configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Control Scripts

The `scripts/` directory contains management scripts:

### Application Control

```bash
# Start application
./scripts/start.sh [dev|production]

# Stop application
./scripts/stop.sh

# Restart application
./scripts/restart.sh [dev|production]

# Check status
./scripts/status.sh
```

### Database Management

```bash
# Initialize database
./scripts/db-init.sh

# Create backup
./scripts/db-backup.sh

# Restore from backup
./scripts/db-restore.sh
```

### Setup

```bash
# Interactive setup wizard
./scripts/setup-wizard.sh

# Full installation
./scripts/install.sh
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Database Connection Failed

1. Check database is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Verify credentials in `.env`

3. Test connection:
   ```bash
   mysql -h localhost -u hotgigs -p
   ```

#### Permission Denied on Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

#### Node.js Version Mismatch

```bash
# Install Node 20+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### pnpm Not Found

```bash
# Install pnpm globally
npm install -g pnpm
```

### Logs

Check application logs:

```bash
# If using systemd
sudo journalctl -u hotgigs -f

# If using PM2
pm2 logs hotgigs

# If running directly
# Logs are output to console
```

### Database Issues

```bash
# Check database status
./scripts/status.sh

# Reinitialize database (WARNING: destroys data)
./scripts/db-init.sh

# Restore from backup
./scripts/db-restore.sh
```

---

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a strong, unique `JWT_SECRET`
- [ ] Configure proper database credentials
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Set up log rotation
- [ ] Review security settings
- [ ] Test disaster recovery procedures

---

## Performance Optimization

### Database

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_application_status ON applications(status);
```

### Application

```bash
# Enable production optimizations
NODE_ENV=production pnpm build
```

### Caching

Consider adding Redis for session storage and caching:

```bash
# Install Redis
sudo apt-get install redis-server

# Configure in .env
REDIS_URL=redis://localhost:6379
```

---

## Security Recommendations

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Firewall** - Restrict access to database ports
3. **Regular Updates** - Keep dependencies up to date
4. **Backup Strategy** - Automated daily backups with off-site storage
5. **Monitoring** - Set up application and infrastructure monitoring
6. **Rate Limiting** - Implement rate limiting for API endpoints
7. **Input Validation** - All user inputs are validated
8. **SQL Injection Protection** - Use parameterized queries (already implemented)

---

## Support

- **Documentation**: [docs.hotgigs.com](https://docs.hotgigs.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/hotgigs-platform/issues)
- **Community**: [Discord Server](https://discord.gg/hotgigs)
- **Email**: support@hotgigs.com

---

## License

See [LICENSE](LICENSE) file for details.

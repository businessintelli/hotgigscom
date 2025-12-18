# HotGigs Platform - Scripts Documentation

This directory contains automation scripts for managing the HotGigs Platform.

---

## Table of Contents

1. [Setup Scripts](#setup-scripts)
2. [Application Control](#application-control)
3. [Database Management](#database-management)
4. [Usage Examples](#usage-examples)

---

## Setup Scripts

### `setup-wizard.sh`

Interactive setup wizard that guides you through the complete installation process.

```bash
./scripts/setup-wizard.sh
```

**Features:**
- Deployment type selection (local/cloud/docker)
- Database configuration
- OAuth setup
- Email configuration
- Automatic dependency installation
- Database initialization

**When to use:** First-time setup or when setting up a new environment.

### `install.sh`

Automated installation script that checks prerequisites and installs the platform.

```bash
./scripts/install.sh
```

**What it does:**
- Detects operating system
- Checks and installs Node.js, pnpm, Git
- Installs MySQL/MariaDB (optional)
- Installs project dependencies
- Creates `.env` file
- Sets up database
- Creates systemd service (Linux only)

**When to use:** Automated installations, CI/CD pipelines, or when you want a non-interactive setup.

---

## Application Control

### `start.sh`

Starts the HotGigs application.

```bash
# Start in development mode (with hot reload)
./scripts/start.sh dev

# Start in production mode
./scripts/start.sh production
```

**Options:**
- `dev` or `development`: Starts with hot reload and development features
- `prod` or `production`: Starts optimized production build

**When to use:** Starting the application after configuration or system reboot.

### `stop.sh`

Gracefully stops the HotGigs application.

```bash
./scripts/stop.sh
```

**What it does:**
- Finds all running HotGigs processes
- Sends SIGTERM for graceful shutdown
- Waits up to 10 seconds
- Force kills if necessary

**When to use:** Stopping the application for maintenance, updates, or system shutdown.

### `restart.sh`

Restarts the HotGigs application.

```bash
# Restart in development mode
./scripts/restart.sh dev

# Restart in production mode
./scripts/restart.sh production
```

**What it does:**
- Stops the application
- Waits 2 seconds
- Starts the application

**When to use:** Applying configuration changes, after code updates, or when the application becomes unresponsive.

### `status.sh`

Checks the health and status of the HotGigs platform.

```bash
./scripts/status.sh
```

**Information displayed:**
- Application process status (running/stopped)
- Process details (PID, CPU, memory usage)
- Port 3000 status
- Database connection status
- Disk space usage
- Memory usage
- Node.js and pnpm versions
- System uptime
- Overall health summary

**When to use:** Monitoring, troubleshooting, or health checks.

---

## Database Management

### `db-init.sh`

Initializes the database from scratch.

```bash
./scripts/db-init.sh
```

**⚠️ WARNING:** This script will **DROP** the existing database and create a new one. All data will be lost!

**What it does:**
- Drops existing database
- Creates new database with proper character set
- Runs all migrations
- Optionally seeds sample data

**When to use:**
- First-time database setup
- Resetting database to clean state
- Development/testing environments

**NOT recommended for:** Production databases with live data.

### `db-backup.sh`

Creates a backup of the database.

```bash
./scripts/db-backup.sh
```

**What it does:**
- Creates compressed SQL dump
- Saves to `backups/` directory with timestamp
- Includes routines, triggers, and events
- Automatically cleans up old backups (keeps last 10)

**Backup location:** `backups/hotgigs_YYYYMMDD_HHMMSS.sql.gz`

**When to use:**
- Before major updates or migrations
- Regular scheduled backups (via cron)
- Before database maintenance

**Recommended schedule:** Daily automated backups via cron:

```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/hotgigs-platform && ./scripts/db-backup.sh
```

### `db-restore.sh`

Restores database from a backup file.

```bash
./scripts/db-restore.sh
```

**What it does:**
- Lists available backups
- Prompts for backup selection
- Creates safety backup before restore
- Restores selected backup

**⚠️ WARNING:** This will **overwrite** all current data!

**When to use:**
- Disaster recovery
- Rolling back after failed migration
- Restoring to previous state

---

## Usage Examples

### Complete Fresh Installation

```bash
# 1. Run setup wizard
./scripts/setup-wizard.sh

# 2. Start application
./scripts/start.sh production

# 3. Check status
./scripts/status.sh
```

### Daily Operations

```bash
# Check application status
./scripts/status.sh

# Restart application
./scripts/restart.sh production

# Create backup
./scripts/db-backup.sh
```

### Maintenance Window

```bash
# 1. Create backup before maintenance
./scripts/db-backup.sh

# 2. Stop application
./scripts/stop.sh

# 3. Perform maintenance (updates, migrations, etc.)
git pull
pnpm install
pnpm db:push

# 4. Start application
./scripts/start.sh production

# 5. Verify status
./scripts/status.sh
```

### Disaster Recovery

```bash
# 1. Stop application
./scripts/stop.sh

# 2. Restore database
./scripts/db-restore.sh

# 3. Start application
./scripts/start.sh production

# 4. Verify status
./scripts/status.sh
```

### Development Workflow

```bash
# Start in development mode
./scripts/start.sh dev

# Make code changes...

# Restart to apply changes
./scripts/restart.sh dev

# Check logs and status
./scripts/status.sh
```

---

## Automated Backups with Cron

### Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hotgigs-platform && ./scripts/db-backup.sh >> /var/log/hotgigs-backup.log 2>&1
```

### Weekly Backups

```bash
# Weekly backup every Sunday at 3 AM
0 3 * * 0 cd /path/to/hotgigs-platform && ./scripts/db-backup.sh >> /var/log/hotgigs-backup.log 2>&1
```

---

## Script Permissions

All scripts should be executable:

```bash
# Make all scripts executable
chmod +x scripts/*.sh

# Or individually
chmod +x scripts/start.sh
chmod +x scripts/stop.sh
chmod +x scripts/restart.sh
chmod +x scripts/status.sh
chmod +x scripts/db-init.sh
chmod +x scripts/db-backup.sh
chmod +x scripts/db-restore.sh
chmod +x scripts/setup-wizard.sh
chmod +x scripts/install.sh
```

---

## Troubleshooting

### Script Not Found

```bash
# Ensure you're in the project root
cd /path/to/hotgigs-platform

# Run with explicit path
./scripts/status.sh
```

### Permission Denied

```bash
# Make script executable
chmod +x scripts/status.sh
```

### Database Connection Failed

Check your `.env` file for correct `DATABASE_URL`:

```bash
# Test database connection
mysql -h localhost -u hotgigs -p
```

### Application Won't Stop

```bash
# Find process manually
ps aux | grep node

# Force kill
kill -9 <PID>
```

---

## Best Practices

1. **Always backup before major changes**
   ```bash
   ./scripts/db-backup.sh
   ```

2. **Check status after operations**
   ```bash
   ./scripts/status.sh
   ```

3. **Use production mode in production**
   ```bash
   ./scripts/start.sh production
   ```

4. **Schedule automated backups**
   - Set up daily cron jobs
   - Store backups off-site

5. **Monitor logs regularly**
   ```bash
   # If using systemd
   sudo journalctl -u hotgigs -f
   ```

6. **Test restore procedures**
   - Regularly test backup restoration
   - Verify data integrity

---

## Support

For issues or questions about these scripts:

- **Documentation**: [INSTALLATION.md](../INSTALLATION.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/hotgigs-platform/issues)
- **Email**: support@hotgigs.com

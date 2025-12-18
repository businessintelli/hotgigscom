# HotGigs Platform - Backup & Restore Guide

## Table of Contents

1. [Overview](#overview)
2. [Admin Dashboard](#admin-dashboard)
3. [Manual Scripts](#manual-scripts)
4. [Automated Backups](#automated-backups)
5. [Restoration Procedures](#restoration-procedures)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The HotGigs platform includes a comprehensive backup and restore system that protects both your **database** and **environment configuration**. You can manage backups through:

- **Admin Dashboard** - Web interface for creating, viewing, and restoring backups
- **Manual Scripts** - Command-line tools for direct backup/restore operations
- **Automated Scheduling** - Cron jobs for regular automated backups

### What Gets Backed Up

**Database Backups:**
- All tables and data
- Stored procedures, triggers, and events
- Database structure and relationships
- Full transactional consistency

**Environment Backups:**
- All environment variables from `.env`
- Sensitive credentials (encrypted)
- Configuration settings
- API keys and secrets

---

## Admin Dashboard

### Accessing the Dashboard

1. Log in as an admin user (info@hotgigs.com)
2. Navigate to **Admin Panel** → **Backup & Restore**
3. View backup statistics and history

### Creating Database Backups

1. Click **"Create Backup"** in the Database Backups section
2. Wait for the backup to complete (typically 10-60 seconds)
3. The backup appears in the history table with:
   - Filename
   - Size
   - Status (completed/failed)
   - Creation timestamp
   - Creator name

### Creating Environment Backups

1. Enter an optional description (e.g., "Before production deployment")
2. Click **"Create Backup"** in the Environment Backups section
3. The backup is created instantly and appears in the history

### Restoring Backups

⚠️ **WARNING: Restoration overwrites current data!**

**To restore a database backup:**
1. Click **"Restore"** next to the desired backup
2. Review the confirmation dialog
3. Type **"RESTORE"** to confirm
4. Wait for the restoration to complete
5. The application may need to be restarted

**To restore an environment backup:**
1. Click **"Restore"** next to the desired backup
2. Review the confirmation dialog
3. Type **"RESTORE"** to confirm
4. Restart the application for changes to take effect

### Deleting Backups

1. Click the **trash icon** next to any backup
2. Confirm the deletion
3. The backup file is permanently removed from disk

---

## Manual Scripts

All scripts are located in the `scripts/` directory and must be run from the project root.

### Database Backup

```bash
# Create a database backup
./scripts/backup-database.sh "Optional description"

# Example
./scripts/backup-database.sh "Pre-migration backup"
```

**Features:**
- Creates compressed SQL dump
- Generates metadata file
- Shows backup size and location
- Optional compression prompt

**Output:**
- Backup file: `backups/database/hotgigs_backup_YYYYMMDD_HHMMSS.sql`
- Metadata: `backups/database/hotgigs_backup_YYYYMMDD_HHMMSS.meta.json`

### Database Restore

```bash
# List available backups
ls -lht backups/database/

# Restore from a specific backup
./scripts/restore-database.sh backups/database/hotgigs_backup_20241218_120000.sql

# Restore from compressed backup
./scripts/restore-database.sh backups/database/hotgigs_backup_20241218_120000.sql.gz
```

**Safety Features:**
- Creates a safety backup before restoration
- Requires typing "RESTORE" to confirm
- Automatic decompression of .gz files
- Option to rollback if restoration fails

### Environment Backup

```bash
# Create an environment backup
./scripts/backup-environment.sh "Optional description"

# Example
./scripts/backup-environment.sh "Production environment snapshot"
```

**Features:**
- Backs up all environment variables
- Creates JSON format for easy inspection
- Generates metadata file
- Warns about sensitive data

**Output:**
- Backup file: `backups/environment/env_backup_YYYYMMDD_HHMMSS.json`
- Metadata: `backups/environment/env_backup_YYYYMMDD_HHMMSS.meta.json`

### Environment Restore

```bash
# List available backups
ls -lht backups/environment/

# Restore from a specific backup
./scripts/restore-environment.sh backups/environment/env_backup_20241218_120000.json
```

**Requirements:**
- Requires `jq` command for JSON parsing
- Creates safety backup of current `.env`
- Requires typing "RESTORE" to confirm
- Reminds to restart application

### Automated Backup

```bash
# Run automated backup (suitable for cron)
./scripts/automated-backup.sh all          # Backup both database and environment
./scripts/automated-backup.sh database     # Database only
./scripts/automated-backup.sh environment  # Environment only
```

**Features:**
- Logs all operations to `logs/backup_YYYYMMDD.log`
- Suitable for cron jobs (no interactive prompts)
- Automatic compression
- Error handling and notifications

### Cleanup Old Backups

```bash
# Clean up backups older than 30 days (default)
./scripts/cleanup-old-backups.sh

# Clean up backups older than 7 days
./scripts/cleanup-old-backups.sh 7

# Clean up backups older than 90 days
./scripts/cleanup-old-backups.sh 90
```

**Features:**
- Shows files to be deleted before confirmation
- Displays freed disk space
- Processes both database and environment backups
- Shows remaining backup count and size

---

## Automated Backups

### Setting Up Cron Jobs

**Daily Database Backup (2 AM):**
```bash
# Edit crontab
crontab -e

# Add this line
0 2 * * * cd /home/ubuntu/hotgigs-platform && ./scripts/automated-backup.sh database >> logs/cron-backup.log 2>&1
```

**Weekly Full Backup (Sunday 3 AM):**
```bash
0 3 * * 0 cd /home/ubuntu/hotgigs-platform && ./scripts/automated-backup.sh all >> logs/cron-backup.log 2>&1
```

**Monthly Cleanup (1st of month, 4 AM):**
```bash
0 4 1 * * cd /home/ubuntu/hotgigs-platform && ./scripts/cleanup-old-backups.sh 30 >> logs/cron-cleanup.log 2>&1
```

### Backup Schedule Examples

**Conservative (High Frequency):**
- Database: Every 6 hours
- Environment: Daily
- Retention: 30 days
- Cleanup: Weekly

**Balanced (Recommended):**
- Database: Daily at 2 AM
- Environment: Weekly
- Retention: 30 days
- Cleanup: Monthly

**Minimal (Low Frequency):**
- Database: Weekly
- Environment: Monthly
- Retention: 90 days
- Cleanup: Quarterly

### Monitoring Automated Backups

**Check backup logs:**
```bash
# View today's backup log
tail -f logs/backup_$(date +%Y%m%d).log

# View recent cron backup logs
tail -f logs/cron-backup.log

# Check for failed backups
grep ERROR logs/backup_*.log
```

**Check backup status:**
```bash
# List recent database backups
ls -lht backups/database/ | head -10

# Check total backup size
du -sh backups/

# Count backups
find backups/ -type f | wc -l
```

---

## Restoration Procedures

### Emergency Database Restore

**Scenario:** Database corruption or data loss

1. **Stop the application:**
   ```bash
   pnpm stop
   ```

2. **Identify the backup to restore:**
   ```bash
   ls -lht backups/database/
   ```

3. **Restore the database:**
   ```bash
   ./scripts/restore-database.sh backups/database/hotgigs_backup_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **Verify restoration:**
   ```bash
   # Check database connectivity
   mysql -h HOST -u USER -p DATABASE -e "SELECT COUNT(*) FROM users;"
   ```

5. **Restart the application:**
   ```bash
   pnpm start
   ```

### Environment Configuration Restore

**Scenario:** Lost or corrupted `.env` file

1. **Identify the backup to restore:**
   ```bash
   ls -lht backups/environment/
   ```

2. **Restore the environment:**
   ```bash
   ./scripts/restore-environment.sh backups/environment/env_backup_YYYYMMDD_HHMMSS.json
   ```

3. **Verify environment variables:**
   ```bash
   # Check critical variables
   grep DATABASE_URL .env
   grep JWT_SECRET .env
   ```

4. **Restart the application:**
   ```bash
   pnpm restart
   ```

### Disaster Recovery

**Scenario:** Complete system failure or migration to new server

1. **Install dependencies on new server:**
   ```bash
   # Install Node.js, MySQL client, etc.
   ```

2. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hotgigs-platform
   ```

3. **Restore environment configuration:**
   ```bash
   # Copy backup file to new server
   scp backups/environment/env_backup_*.json new-server:/path/to/project/backups/environment/
   
   # Restore environment
   ./scripts/restore-environment.sh backups/environment/env_backup_*.json
   ```

4. **Restore database:**
   ```bash
   # Copy backup file to new server
   scp backups/database/hotgigs_backup_*.sql.gz new-server:/path/to/project/backups/database/
   
   # Restore database
   ./scripts/restore-database.sh backups/database/hotgigs_backup_*.sql.gz
   ```

5. **Install dependencies and start:**
   ```bash
   pnpm install
   pnpm start
   ```

---

## Best Practices

### Backup Frequency

**Critical Production Systems:**
- Database: Every 6 hours
- Environment: Before each deployment
- Retention: 30-90 days

**Development/Staging:**
- Database: Daily
- Environment: Weekly
- Retention: 7-30 days

### Storage Management

**Disk Space Monitoring:**
```bash
# Check backup directory size
du -sh backups/

# Check available disk space
df -h

# Find largest backups
find backups/ -type f -exec du -h {} \; | sort -rh | head -10
```

**Compression:**
- Always compress database backups (saves 70-90% space)
- Environment backups are small, compression optional
- Use `.gz` format for compatibility

**Off-site Storage:**
- Copy critical backups to external storage
- Use cloud storage (S3, Google Cloud Storage)
- Maintain 3-2-1 backup strategy:
  - 3 copies of data
  - 2 different storage types
  - 1 off-site copy

### Security

**Protect Backup Files:**
```bash
# Set restrictive permissions
chmod 600 backups/environment/*.json
chmod 600 backups/database/*.sql*

# Restrict directory access
chmod 700 backups/
```

**Encrypt Sensitive Backups:**
```bash
# Encrypt environment backup
gpg --symmetric --cipher-algo AES256 backups/environment/env_backup_*.json

# Decrypt when needed
gpg --decrypt backups/environment/env_backup_*.json.gpg > env_backup.json
```

**Access Control:**
- Limit backup access to admin users only
- Use separate credentials for backup operations
- Audit backup access logs regularly

### Testing Restorations

**Monthly Restoration Test:**
1. Create a test database
2. Restore latest backup to test database
3. Verify data integrity
4. Document any issues
5. Update restoration procedures

**Validation Checklist:**
- [ ] Database restored successfully
- [ ] All tables present
- [ ] Row counts match expectations
- [ ] Application connects successfully
- [ ] Critical features work
- [ ] Environment variables correct

---

## Troubleshooting

### Common Issues

**Issue: "mysqldump: command not found"**

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# macOS
brew install mysql-client

# Add to PATH if needed
export PATH="/usr/local/opt/mysql-client/bin:$PATH"
```

**Issue: "jq: command not found"**

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

**Issue: "Access denied for user"**

**Solution:**
- Check DATABASE_URL in `.env`
- Verify database credentials
- Ensure user has necessary permissions:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON database.* TO 'user'@'host';
  ```

**Issue: "Backup file too large"**

**Solution:**
- Enable compression (saves 70-90% space)
- Increase disk space
- Implement more aggressive cleanup policy
- Consider incremental backups

**Issue: "Restore fails midway"**

**Solution:**
1. Check error message in output
2. Verify backup file integrity:
   ```bash
   gunzip -t backup.sql.gz
   ```
3. Ensure sufficient disk space
4. Check database connection
5. Restore from safety backup if needed

**Issue: "Environment variables not taking effect"**

**Solution:**
1. Verify `.env` file was updated
2. Restart the application:
   ```bash
   pnpm restart
   ```
3. Check for syntax errors in `.env`
4. Ensure no duplicate variable definitions

### Getting Help

**Check Logs:**
```bash
# Application logs
tail -f logs/app.log

# Backup logs
tail -f logs/backup_$(date +%Y%m%d).log

# System logs
journalctl -u hotgigs-platform -f
```

**Verify System Status:**
```bash
# Check application status
pnpm status

# Check database connectivity
mysql -h HOST -u USER -p -e "SELECT 1"

# Check disk space
df -h

# Check backup files
ls -lh backups/database/ backups/environment/
```

**Contact Support:**
- Email: support@hotgigs.com
- Include: Error messages, log excerpts, backup timestamps
- Describe: What you were trying to do, what happened instead

---

## Appendix

### Backup File Naming Convention

**Database Backups:**
- Format: `hotgigs_backup_YYYYMMDD_HHMMSS.sql[.gz]`
- Example: `hotgigs_backup_20241218_143022.sql.gz`

**Environment Backups:**
- Format: `env_backup_YYYYMMDD_HHMMSS.json`
- Example: `env_backup_20241218_143022.json`

**Metadata Files:**
- Format: `{backup_name}.meta.json`
- Example: `hotgigs_backup_20241218_143022.meta.json`

### Metadata File Structure

**Database Backup Metadata:**
```json
{
  "timestamp": "2024-12-18T14:30:22Z",
  "database": "hotgigs_production",
  "host": "db.example.com",
  "port": 3306,
  "filename": "hotgigs_backup_20241218_143022.sql",
  "size_bytes": 52428800,
  "size_mb": 50.0,
  "description": "Pre-deployment backup",
  "backup_type": "manual",
  "created_by": "admin",
  "hostname": "prod-server-01"
}
```

**Environment Backup Metadata:**
```json
{
  "timestamp": "2024-12-18T14:30:22Z",
  "filename": "env_backup_20241218_143022.json",
  "size_bytes": 2048,
  "description": "Production environment snapshot",
  "created_by": "admin",
  "hostname": "prod-server-01",
  "variable_count": 25,
  "sensitive_count": 8
}
```

### Quick Reference Commands

```bash
# Create backups
./scripts/backup-database.sh "Description"
./scripts/backup-environment.sh "Description"

# Restore backups
./scripts/restore-database.sh backups/database/file.sql.gz
./scripts/restore-environment.sh backups/environment/file.json

# Automated backup
./scripts/automated-backup.sh all

# Cleanup old backups
./scripts/cleanup-old-backups.sh 30

# Check backup status
ls -lht backups/database/ | head
ls -lht backups/environment/ | head
du -sh backups/

# Verify backup integrity
gunzip -t backups/database/*.sql.gz
jq empty backups/environment/*.json
```

---

**Last Updated:** December 18, 2024  
**Version:** 1.0.0  
**Maintained By:** HotGigs Platform Team

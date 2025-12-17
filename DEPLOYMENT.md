# HotGigs Platform - Deployment Guide

This guide covers deploying the HotGigs platform using Docker in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum for application + database
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

### Software Requirements
- **Docker**: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository

### API Keys & Services
- **OpenAI API Key**: For AI features (resume parsing, matching, interviews)
- **SendGrid or Resend API Key**: For email notifications
- **Manus Forge API Key**: Provided automatically in Manus environment
- **Zoom/Teams Credentials**: Optional, for video conferencing integration
- **LinkedIn API Credentials**: Optional, for candidate sourcing

## Docker Deployment

### Quick Start (Development)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hotgigs-platform.git
cd hotgigs-platform
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Edit .env file** with your configuration:
```bash
nano .env  # or use your preferred editor
```

Minimum required variables:
```env
# Database
DATABASE_URL=mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# AI Features
OPENAI_API_KEY=sk-your-openai-api-key
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Email
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

4. **Start all services**
```bash
docker-compose up -d
```

5. **Wait for services to be ready** (30-60 seconds)
```bash
docker-compose logs -f app
# Wait for "Server running on http://localhost:3000/"
```

6. **Run database migrations**
```bash
docker-compose exec app pnpm db:push
```

7. **Seed sample data** (optional but recommended for testing)
```bash
docker-compose exec app pnpm db:seed
```

8. **Access the application**
- **Application**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080 (username: `root`, password: `root_password`)
- **MinIO Console**: http://localhost:9001 (username: `minioadmin`, password: `minioadmin123`)

### Docker Compose Services

The `docker-compose.yml` includes these services:

| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | HotGigs application (Node.js + React) |
| **mysql** | 3306 | MySQL 8.0 database |
| **redis** | 6379 | Redis cache (optional) |
| **phpmyadmin** | 8080 | Database management UI |
| **minio** | 9000, 9001 | S3-compatible file storage |

### Service Management

**View logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mysql
```

**Restart services**:
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart app
```

**Stop services**:
```bash
docker-compose stop
```

**Remove services** (keeps data):
```bash
docker-compose down
```

**Remove services and data** (caution!):
```bash
docker-compose down -v
```

## Environment Configuration

### Required Environment Variables

**Application**:
```env
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=HotGigs - AI-Powered Recruitment Platform
```

**Database**:
```env
DATABASE_URL=mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs
```

**Authentication**:
```env
JWT_SECRET=generate-a-secure-random-string-minimum-32-characters
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

**AI & LLM**:
```env
OPENAI_API_KEY=sk-your-openai-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

**Email**:
```env
SENDGRID_API_KEY=SG.your-sendgrid-api-key
# OR
RESEND_API_KEY=re_your-resend-api-key
```

### Optional Environment Variables

**File Storage (S3)**:
```env
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=hotgigs-files
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
```

**Video Conferencing**:
```env
# Zoom
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_ACCOUNT_ID=your-zoom-account-id

# Microsoft Teams
TEAMS_CLIENT_ID=your-teams-client-id
TEAMS_CLIENT_SECRET=your-teams-client-secret
TEAMS_TENANT_ID=your-teams-tenant-id
```

**LinkedIn Integration**:
```env
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_API_KEY=your-linkedin-api-key
```

**Redis Cache**:
```env
REDIS_URL=redis://redis:6379
```

### Generating Secure Secrets

**JWT Secret**:
```bash
openssl rand -base64 32
```

**General Secret**:
```bash
openssl rand -hex 32
```

## Database Setup

### Initial Setup

1. **Create database** (done automatically by Docker):
```bash
docker-compose exec mysql mysql -u root -proot_password -e "CREATE DATABASE IF NOT EXISTS hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. **Run migrations**:
```bash
docker-compose exec app pnpm db:push
```

3. **Verify schema**:
```bash
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs -e "SHOW TABLES;"
```

### Seeding Data

**Comprehensive seed** (recommended for testing):
```bash
docker-compose exec app pnpm db:seed
```

This creates:
- 1 Platform Admin
- 1 Company Admin
- 5 Recruiters
- 20 Candidates
- 15 Job Postings
- 30 Applications
- 10 Interviews
- Sample email campaigns

**Custom seeding**:
```bash
# Coding challenges only
docker-compose exec app node server/scripts/seed-challenges.mjs
```

### Database Backup

**Backup database**:
```bash
docker-compose exec mysql mysqldump -u hotgigs -photgigs_password hotgigs > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore database**:
```bash
docker-compose exec -T mysql mysql -u hotgigs -photgigs_password hotgigs < backup_20240101_120000.sql
```

### Database Management

**Access MySQL shell**:
```bash
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs
```

**Access phpMyAdmin**:
- URL: http://localhost:8080
- Server: `mysql`
- Username: `root`
- Password: `root_password`

## Production Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hotgigs-app-prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - hotgigs-network

  mysql:
    image: mysql:8.0
    container_name: hotgigs-mysql-prod
    restart: always
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=hotgigs
      - MYSQL_USER=hotgigs
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data_prod:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hotgigs-network

volumes:
  mysql_data_prod:
    driver: local

networks:
  hotgigs-network:
    driver: bridge
```

### Production Deployment Steps

1. **Create production environment file**:
```bash
cp .env.example .env.production
nano .env.production  # Configure with production values
```

2. **Build and start production services**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Run migrations**:
```bash
docker-compose -f docker-compose.prod.yml exec app pnpm db:push
```

4. **Verify deployment**:
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f app
```

### Production Best Practices

**Security**:
- Use strong, unique passwords for all services
- Never commit `.env` or `.env.production` to version control
- Use secrets management (Docker Secrets, AWS Secrets Manager)
- Enable SSL/TLS with reverse proxy (Nginx, Traefik)
- Restrict database access to application network only
- Keep Docker images updated

**Performance**:
- Use production-optimized builds (`NODE_ENV=production`)
- Enable Redis caching
- Configure database connection pooling
- Use CDN for static assets
- Implement rate limiting

**Reliability**:
- Set `restart: always` for all services
- Configure health checks
- Set up automated backups
- Monitor logs and metrics
- Implement graceful shutdown

### Reverse Proxy with Nginx

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name hotgigs.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hotgigs.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

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

## Monitoring & Maintenance

### Health Checks

**Application health**:
```bash
curl http://localhost:3000/api/health
```

**Database health**:
```bash
docker-compose exec mysql mysqladmin ping -h localhost -u hotgigs -photgigs_password
```

**Redis health**:
```bash
docker-compose exec redis redis-cli ping
```

### Log Management

**View recent logs**:
```bash
docker-compose logs --tail=100 app
```

**Follow logs in real-time**:
```bash
docker-compose logs -f app
```

**Export logs**:
```bash
docker-compose logs app > app_logs_$(date +%Y%m%d).log
```

### Performance Monitoring

**Container stats**:
```bash
docker stats
```

**Disk usage**:
```bash
docker system df
```

**Database size**:
```bash
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'hotgigs' GROUP BY table_schema;"
```

### Maintenance Tasks

**Update application**:
```bash
git pull origin main
docker-compose up -d --build app
docker-compose exec app pnpm db:push  # Run new migrations
```

**Clean up Docker resources**:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (caution!)
docker volume prune

# Remove all unused resources
docker system prune -a
```

**Optimize database**:
```bash
docker-compose exec mysql mysqlcheck -u hotgigs -photgigs_password --optimize --all-databases
```

## Troubleshooting

### Common Issues

**Application won't start**:
```bash
# Check logs
docker-compose logs app

# Common causes:
# - Missing environment variables
# - Database not ready
# - Port 3000 already in use
```

**Database connection errors**:
```bash
# Verify database is running
docker-compose ps mysql

# Check database health
docker-compose exec mysql mysqladmin ping -h localhost -u hotgigs -photgigs_password

# Verify connection string in .env
# Should be: mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs
```

**Migration errors**:
```bash
# Reset database (caution! loses all data)
docker-compose down -v
docker-compose up -d
docker-compose exec app pnpm db:push
docker-compose exec app pnpm db:seed
```

**Port conflicts**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

**Out of memory**:
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or add memory limits to docker-compose.yml:
services:
  app:
    mem_limit: 2g
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Restart services:
```bash
docker-compose restart app
docker-compose logs -f app
```

### Getting Help

1. Check application logs: `docker-compose logs app`
2. Check database logs: `docker-compose logs mysql`
3. Verify environment variables: `docker-compose exec app env`
4. Test database connection: `docker-compose exec app pnpm db:push`
5. Open an issue on GitHub with logs and error messages

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

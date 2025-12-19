# HotGigs Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the HotGigs AI-powered recruitment platform in various environments, from local development to production cloud deployments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start - Local Development](#quick-start---local-development)
4. [Docker Deployment](#docker-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

## Deployment Overview

The HotGigs platform is a modern full-stack web application built with **React 19**, **Node.js**, **Express**, **tRPC**, and **MySQL**. The deployment process involves several key stages that ensure a smooth transition from development to production.

### Architecture Components

The platform consists of multiple interconnected services that work together to provide a complete recruitment solution. The **application server** handles both frontend React components and backend tRPC API procedures, serving as the primary interface for all user interactions. The **MySQL database** stores all persistent data including user profiles, job postings, applications, interviews, and AI-generated insights. The **Redis cache** (optional) improves performance by caching frequently accessed data and managing session storage. The **MinIO object storage** provides S3-compatible file storage for resumes, profile pictures, and other uploaded documents. Finally, **phpMyAdmin** offers a convenient web-based interface for database management and debugging.

### Deployment Strategies

Organizations can choose from several deployment approaches based on their requirements and infrastructure. **Local development** uses Docker Compose to run all services on a single machine, ideal for development, testing, and small-scale demos. **Single-server production** deploys all services on one VPS or dedicated server using Docker Compose, suitable for small to medium businesses with moderate traffic. **Cloud-native deployment** leverages managed services like AWS RDS for database, S3 for storage, and ElastiCache for Redis, providing better scalability and reliability. **Kubernetes deployment** orchestrates containers across multiple nodes for high availability and automatic scaling, recommended for enterprise deployments with high traffic.

### Key Deployment Steps

The deployment process follows a systematic workflow to ensure all components are properly configured and operational. The process begins with **environment preparation**, where the target system is configured with required dependencies including Docker, Node.js, and necessary API keys. Next comes **service initialization**, which involves pulling Docker images, creating containers, and establishing network connections between services. The **database setup** phase runs schema migrations, creates tables and indexes, and optionally seeds initial data for testing. **Application configuration** sets environment variables, configures authentication providers, and establishes connections to external services like OpenAI and SendGrid. Finally, **verification and testing** ensures all services are running correctly, API endpoints respond as expected, and the frontend can communicate with the backend.

### Automation Scripts

The platform includes several automation scripts designed to simplify deployment and maintenance tasks. The **install.sh** script provides automated installation with OS detection, dependency checking, and guided configuration. The **setup-wizard.sh** script offers an interactive setup experience with step-by-step prompts for configuration values. Database management is handled by **db-init.sh** for initialization, **db-backup.sh** for creating backups, and **db-restore.sh** for restoring from backups. The **seed.mjs** script populates the database with realistic sample data for testing and demonstrations. The **initialize-budgets.mjs** script sets default monthly budget limits for company accounts. Application control is managed through **start.sh**, **stop.sh**, and **restart.sh** scripts, while **status.sh** provides comprehensive health monitoring.

### Security Considerations

Security is paramount in any recruitment platform handling sensitive candidate and company data. **Authentication** uses JWT tokens for session management and OAuth 2.0 integration with Manus identity provider. **Data encryption** ensures all sensitive data is encrypted at rest in the database and in transit using HTTPS/TLS. **API security** implements rate limiting to prevent abuse, input validation to prevent injection attacks, and CORS configuration to restrict cross-origin requests. **File upload security** validates file types and sizes, scans uploads for malware, and stores files with non-enumerable paths. **Environment variables** keep secrets out of source code, use strong random values for JWT secrets, and rotate API keys regularly.

### Performance Optimization

The platform is designed with performance in mind, incorporating several optimization strategies. **Database optimization** uses indexes on frequently queried columns, connection pooling to reduce overhead, and query optimization to minimize execution time. **Caching strategies** leverage Redis for session storage, cache frequently accessed data like job listings, and implement cache invalidation on data updates. **Frontend optimization** employs code splitting to reduce initial bundle size, lazy loading for routes and components, and asset optimization through minification and compression. **API optimization** batches database queries where possible, implements pagination for large result sets, and uses tRPC's efficient serialization with Superjson.

### Monitoring and Maintenance

Ongoing monitoring and maintenance ensure the platform remains healthy and performant. **Health checks** monitor service availability, database connection status, and API response times. **Log management** centralizes logs from all services, implements log rotation to prevent disk space issues, and sets up alerts for critical errors. **Backup strategy** includes automated daily database backups, weekly full system backups, and testing restore procedures regularly. **Update procedures** involve staging environment testing before production, database migration testing, and rollback plans for failed deployments.

## Prerequisites

### System Requirements

The platform requires adequate computing resources to run smoothly. A minimum of **2 CPU cores** is required, though 4 cores are recommended for production environments. **RAM requirements** start at 4GB minimum, with 8GB recommended for development and 16GB+ for production deployments. **Storage needs** include at least 20GB for application and database, plus additional space for uploaded files and backups. The platform supports **Linux** (Ubuntu 20.04+, Debian 11+, CentOS 8+), **macOS** (10.15+), and **Windows** with WSL2.

### Software Requirements

Several software components must be installed before deployment. **Docker** version 20.10 or higher provides containerization for all services and can be installed from the [official Docker documentation](https://docs.docker.com/get-docker/). **Docker Compose** version 2.0 or higher orchestrates multi-container deployments and is available through the [Docker Compose installation guide](https://docs.docker.com/compose/install/). **Git** is required for cloning the repository and managing version control. **Node.js** version 20.x or higher is needed for running scripts outside Docker, available from [nodejs.org](https://nodejs.org/).

### API Keys & Services

The platform integrates with several external services that require API credentials. An **OpenAI API Key** is essential for AI features including resume parsing, candidate-job matching, and AI interview question generation. Email functionality requires either a **SendGrid API Key** or **Resend API Key** for transactional emails and notifications. The **Manus Forge API Key** is provided automatically when deploying in the Manus environment. Optional integrations include **Zoom/Teams credentials** for video conferencing integration and **LinkedIn API credentials** for candidate sourcing features.

### Network Requirements

Proper network configuration ensures all services can communicate effectively. **Port availability** requires port 3000 for the application, 3306 for MySQL, 6379 for Redis, 8080 for phpMyAdmin, and 9000-9001 for MinIO. **Firewall rules** should allow inbound traffic on port 3000 (HTTP/HTTPS) and outbound traffic for API calls to OpenAI, SendGrid, and other services. **DNS configuration** involves setting up a domain name pointing to your server IP and configuring SSL certificates for HTTPS (recommended: Let's Encrypt).

## Quick Start - Local Development

This section provides the fastest path to getting HotGigs running on your local machine for development and testing purposes.

### Method 1: Automated Installation (Recommended)

The automated installation script handles all setup steps with minimal user input. Begin by cloning the repository and navigating to the project directory:

```bash
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom
```

Make the installation script executable and run it:

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

The script will automatically detect your operating system, check for required dependencies, install missing components, prompt for configuration values, create the `.env` file with your settings, start all Docker services, run database migrations, and optionally seed sample data.

The installation typically takes 5-10 minutes depending on your internet connection and system resources. Once complete, access the application at **http://localhost:3000**.

### Method 2: Interactive Setup Wizard

For users who prefer a guided setup experience with more control over configuration options, the setup wizard provides an interactive approach:

```bash
chmod +x scripts/setup-wizard.sh
./scripts/setup-wizard.sh
```

The wizard will guide you through several configuration steps. It begins with **dependency checking**, verifying Docker, Docker Compose, Node.js, and Git installations. The **configuration wizard** then prompts for database credentials, JWT secret generation, OpenAI API key, email service selection (SendGrid or Resend), and optional service configurations. After configuration, it proceeds with **service deployment** by starting Docker containers, waiting for services to be ready, and running database migrations. The wizard offers **data seeding options** including comprehensive sample data with users, jobs, and applications, minimal data with just admin accounts, or skipping seeding entirely. Finally, it performs **verification** by checking service health, testing database connectivity, and validating API endpoints.

### Method 3: Manual Docker Setup

For developers who prefer full control over each step, manual setup provides maximum flexibility:

```bash
# Clone repository
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

Configure the minimum required variables in your `.env` file:

```env
# Database
DATABASE_URL=mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# AI Features
OPENAI_API_KEY=sk-your-openai-api-key
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Email (choose one)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
# OR
RESEND_API_KEY=re_your-resend-api-key
```

Start all services using Docker Compose:

```bash
docker-compose up -d
```

Wait for services to initialize (typically 30-60 seconds), then verify they are running:

```bash
docker-compose ps
docker-compose logs -f app
# Wait for "Server running on http://localhost:3000/"
```

Run database migrations to create the schema:

```bash
docker-compose exec app pnpm db:push
```

Optionally seed sample data for testing:

```bash
docker-compose exec app pnpm db:seed
```

### Accessing the Application

Once deployment is complete, you can access various components of the platform:

- **Main Application**: http://localhost:3000 - The primary user interface for recruiters and candidates
- **phpMyAdmin**: http://localhost:8080 - Database management interface (username: `root`, password: `root_password`)
- **MinIO Console**: http://localhost:9001 - Object storage management (username: `minioadmin`, password: `minioadmin123`)

### Default Demo Accounts

If you ran the seed script, the following demo accounts are available for testing:

**Platform Admin**:
- Email: admin@hotgigs.com
- Password: Admin123!
- Access: Full platform administration

**Recruiter Account**:
- Email: sarah.recruiter@techcorp.com
- Password: Recruiter123!
- Access: Recruiter dashboard, job management, candidate screening

**Candidate Account**:
- Email: emily.candidate@email.com
- Password: Candidate123!
- Access: Candidate dashboard, job browsing, application tracking

**Panelist Account**:
- Email: robert.panelist@techcorp.com
- Password: Panelist123!
- Access: Interview evaluation, candidate assessment

## Docker Deployment

### Docker Compose Services

The `docker-compose.yml` file defines all services required to run the HotGigs platform. Understanding each service helps with troubleshooting and customization.

| Service | Port | Description | Resource Requirements |
|---------|------|-------------|----------------------|
| **app** | 3000 | HotGigs application (Node.js + React) | 1GB RAM, 1 CPU |
| **mysql** | 3306 | MySQL 8.0 database | 2GB RAM, 1 CPU |
| **redis** | 6379 | Redis cache (optional) | 512MB RAM, 0.5 CPU |
| **phpmyadmin** | 8080 | Database management UI | 256MB RAM, 0.25 CPU |
| **minio** | 9000, 9001 | S3-compatible file storage | 512MB RAM, 0.5 CPU |

### Service Configuration

Each service can be customized through environment variables and Docker Compose configuration. The **app service** builds from the Dockerfile in the project root, mounts the current directory for development hot-reload, and depends on MySQL and Redis services. The **mysql service** uses persistent volumes for data storage, is configured with custom character set (utf8mb4), and runs initialization scripts from `docker/mysql/init.sql`. The **redis service** provides optional caching with persistent storage and default configuration suitable for development. The **minio service** offers S3-compatible object storage with web console access and automatic bucket creation.

### Service Management

Managing Docker services effectively requires understanding common operations. To **view logs** from all services, use `docker-compose logs -f`. For a specific service, append the service name: `docker-compose logs -f app` or `docker-compose logs -f mysql`. To **restart services**, use `docker-compose restart` for all services or `docker-compose restart app` for a specific service. To **stop services** without removing containers, use `docker-compose stop`. To **remove services** while keeping data volumes, use `docker-compose down`. To **remove services and data** (use with caution), execute `docker-compose down -v`.

### Health Checks

Docker Compose includes health checks for critical services to ensure they are ready before dependent services start. The **MySQL health check** verifies database connectivity using `mysqladmin ping`. The **Redis health check** tests responsiveness with `redis-cli ping`. The **Application health check** confirms the HTTP server is responding on port 3000.

### Volume Management

Docker volumes persist data across container restarts and recreations. The **mysql_data** volume stores all database files ensuring data survives container updates. The **redis_data** volume persists cache data if Redis is configured for persistence. The **minio_data** volume stores uploaded files in S3-compatible format.

To back up volumes, use Docker's built-in volume backup commands:

```bash
# Backup MySQL volume
docker run --rm -v hotgigs_mysql_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mysql_backup.tar.gz /data

# Restore MySQL volume
docker run --rm -v hotgigs_mysql_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/mysql_backup.tar.gz -C /
```

## Environment Configuration

### Required Environment Variables

Proper environment configuration is critical for security and functionality. The following variables must be set for the platform to operate correctly.

**Application Settings**:
```env
NODE_ENV=production              # Set to 'development' for local development
PORT=3000                        # Port for the application server
VITE_APP_TITLE=HotGigs - AI-Powered Recruitment Platform
VITE_APP_LOGO=/logo.svg         # Path to application logo
```

**Database Configuration**:
```env
DATABASE_URL=mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs
```

The database URL format is `mysql://username:password@host:port/database`. For Docker deployments, the host is the service name (`mysql`). For external databases, use the actual hostname or IP address.

**Authentication Settings**:
```env
JWT_SECRET=generate-a-secure-random-string-minimum-32-characters
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=owner-unique-identifier
OWNER_NAME=Platform Owner Name
```

The JWT secret should be a cryptographically secure random string of at least 32 characters. Generate one using `openssl rand -base64 32`.

**AI & LLM Configuration**:
```env
OPENAI_API_KEY=sk-your-openai-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

The OpenAI API key enables AI-powered features including resume parsing, candidate-job matching, interview question generation, and response evaluation.

**Email Configuration**:
```env
# Option 1: SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Option 2: Resend
RESEND_API_KEY=re_your-resend-api-key
```

Choose either SendGrid or Resend for transactional email delivery. Both services offer free tiers suitable for development and testing.

### Optional Environment Variables

Additional features can be enabled through optional environment variables.

**File Storage (S3)**:
```env
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=hotgigs-files
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com
```

By default, the platform uses MinIO for local S3-compatible storage. For production, configure AWS S3 or another S3-compatible service.

**Video Conferencing Integration**:
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

Video conferencing integration enables automatic meeting creation and calendar integration for interviews.

**LinkedIn Integration**:
```env
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_API_KEY=your-linkedin-api-key
```

LinkedIn integration allows candidate sourcing directly from LinkedIn profiles and job posting to LinkedIn.

**Redis Cache**:
```env
REDIS_URL=redis://redis:6379
```

Redis caching improves performance by storing frequently accessed data in memory.

**Analytics**:
```env
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

Optional analytics integration for tracking user behavior and platform usage.

### Generating Secure Secrets

Security best practices require strong, random secrets for authentication and encryption.

**JWT Secret** (32+ characters):
```bash
openssl rand -base64 32
```

**General Secret** (64 hex characters):
```bash
openssl rand -hex 32
```

**Password Hash** (for testing):
```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword123!', 10))"
```

### Environment File Management

Never commit `.env` files to version control. The repository includes `.env.example` as a template. For production deployments, use environment-specific files:

- `.env.development` - Local development settings
- `.env.staging` - Staging environment settings
- `.env.production` - Production environment settings

Use Docker secrets or environment variable injection for sensitive values in production environments.

## Database Setup

### Database Schema Overview

The HotGigs platform uses a comprehensive relational database schema designed to support all recruitment workflow features. The schema includes tables for **user management** (users, recruiters, candidates, panelists), **job management** (jobs, job_requirements, job_responsibilities), **application tracking** (applications, application_status_history), **interview scheduling** (interviews, interview_responses, interview_evaluations), **AI features** (ai_match_scores, ai_interview_questions, ai_evaluations), **company management** (companies, company_admins, company_budgets), **communication** (email_campaigns, notifications), and **analytics** (saved_searches, candidate_views, job_views).

### Initial Database Setup

The database setup process involves several sequential steps to ensure proper schema creation and data initialization.

**Step 1: Verify Database Service**

Ensure the MySQL container is running and healthy:

```bash
docker-compose ps mysql
docker-compose logs mysql
```

Look for the message "MySQL init process done. Ready for start up."

**Step 2: Create Database** (done automatically by Docker):

The `docker/mysql/init.sql` script automatically creates the database with proper character encoding:

```sql
CREATE DATABASE IF NOT EXISTS hotgigs 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

Verify the database exists:

```bash
docker-compose exec mysql mysql -u root -proot_password -e "SHOW DATABASES;"
```

**Step 3: Run Schema Migrations**

The platform uses Drizzle ORM for database migrations. Push the schema to create all tables:

```bash
docker-compose exec app pnpm db:push
```

This command reads the schema definition from `drizzle/schema.ts` and creates all necessary tables, indexes, and foreign key constraints.

**Step 4: Verify Schema**

Confirm all tables were created successfully:

```bash
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs -e "SHOW TABLES;"
```

You should see approximately 30-40 tables including `users`, `recruiters`, `candidates`, `jobs`, `applications`, `interviews`, and many others.

### Database Seeding

The `seed.mjs` script populates the database with realistic sample data for testing and demonstrations. This is essential for development and staging environments to provide a complete user experience without manual data entry.

**Purpose of seed.mjs**

The seed script serves multiple important purposes in the development and testing workflow. It **creates realistic test data** including diverse candidate profiles with varied skills and experience levels, job postings across different industries and roles, applications in various stages of the recruitment pipeline, and scheduled interviews with different statuses. It **enables feature testing** by providing sufficient data to test search and filtering functionality, AI matching algorithms with real candidate-job pairs, interview scheduling and management workflows, and analytics dashboards with meaningful metrics. It **supports demonstrations** through ready-to-use demo accounts for different user roles, realistic data for client presentations, and complete workflows from job posting to candidate hiring.

**What seed.mjs Creates**

The seed script generates a comprehensive dataset that mirrors real-world usage:

- **1 Platform Admin**: Full system access for platform management
- **1 Company Admin**: Company-level administration and oversight
- **5 Recruiters**: Representing different companies and recruitment styles
- **3 Panelists**: For interview evaluation and candidate assessment
- **20 Candidates**: Diverse profiles with varying skills, experience levels, and backgrounds
- **15 Job Postings**: Across technology, marketing, sales, and operations roles
- **30 Applications**: Distributed across different jobs and status stages
- **10 Interviews**: Scheduled, completed, and cancelled interviews
- **5 Email Campaigns**: Sample recruitment marketing campaigns
- **AI Match Scores**: Pre-calculated candidate-job match percentages
- **Sample Budgets**: Company budget allocations for recruitment activities

**Running the Seed Script**

Execute the seed script after running database migrations:

```bash
docker-compose exec app pnpm db:seed
```

The script takes approximately 30-60 seconds to complete and provides progress output showing each data category being created. Upon completion, you'll see a summary of created records.

**Seed Script Output Example**

```
[Seed] Starting database seeding...
[Seed] Creating users...
[Seed] ✓ Created 30 users
[Seed] Creating companies...
[Seed] ✓ Created 5 companies
[Seed] Creating recruiters...
[Seed] ✓ Created 5 recruiters
[Seed] Creating candidates...
[Seed] ✓ Created 20 candidates
[Seed] Creating jobs...
[Seed] ✓ Created 15 jobs
[Seed] Creating applications...
[Seed] ✓ Created 30 applications
[Seed] Creating interviews...
[Seed] ✓ Created 10 interviews
[Seed] Seeding completed successfully!
```

**Resetting Seed Data**

To clear existing data and re-run the seed script:

```bash
# Clear all data (caution: this deletes everything)
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs -e "DROP DATABASE hotgigs; CREATE DATABASE hotgigs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Re-run migrations
docker-compose exec app pnpm db:push

# Re-run seed
docker-compose exec app pnpm db:seed
```

### Budget Initialization

The `initialize-budgets.mjs` script sets default monthly budget limits for company accounts that don't have budgets configured.

**Purpose of initialize-budgets.mjs**

Budget management is a critical feature for companies using the platform to control recruitment spending. The initialize-budgets script **sets default limits** by assigning a $500/month default budget to all companies, preventing unlimited spending on AI features and job postings, and establishing baseline budget tracking. It **enables budget enforcement** through automatic tracking of AI API usage costs, job posting fees, and premium feature consumption. It **supports financial planning** by providing visibility into recruitment costs, enabling budget alerts and notifications, and facilitating cost allocation across departments.

**What initialize-budgets.mjs Does**

The script performs several key operations to establish budget controls:

1. **Identifies companies without budgets**: Queries the database for company records lacking budget entries
2. **Creates default budget entries**: Inserts budget records with $500 monthly limit and $0 current spending
3. **Sets budget periods**: Configures monthly billing cycles starting from the current date
4. **Enables notifications**: Activates budget alert notifications at 80% and 100% thresholds
5. **Logs initialization**: Provides detailed output of companies initialized with budgets

**Running the Budget Initialization Script**

Execute the script after seeding company data:

```bash
docker-compose exec app node scripts/initialize-budgets.mjs
```

The script connects to the running application API and calls the `budgetManagement.initializeDefaultBudgets` tRPC procedure.

**Script Output Example**

```
[Budget Init] Starting budget initialization...
[Budget Init] Success: { result: { data: { initialized: 5 } } }
[Budget Init] Initialized 5 company budgets
```

**When to Run Budget Initialization**

Run the budget initialization script in several scenarios:

- **After initial deployment**: Set up budgets for all companies during platform setup
- **After adding new companies**: Initialize budgets when onboarding new client companies
- **After data migration**: Ensure all migrated companies have budget entries
- **Periodic maintenance**: Run monthly to catch any companies missing budget records

**Customizing Default Budgets**

To change the default budget amount, modify the backend procedure in `server/routers.ts`:

```typescript
initializeDefaultBudgets: protectedProcedure
  .mutation(async ({ ctx }) => {
    const DEFAULT_MONTHLY_BUDGET = 1000; // Change this value
    // ... rest of procedure
  }),
```

### Database Backup and Restore

Regular backups are essential for data protection and disaster recovery.

**Creating Backups**

The platform includes automated backup scripts for comprehensive data protection.

**Using the backup script**:
```bash
./scripts/backup-database.sh
```

This creates a timestamped backup file in the `backups/` directory with the format `hotgigs_backup_YYYYMMDD_HHMMSS.sql`.

**Manual backup**:
```bash
docker-compose exec mysql mysqldump -u hotgigs -photgigs_password hotgigs > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Backup with compression**:
```bash
docker-compose exec mysql mysqldump -u hotgigs -photgigs_password hotgigs | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Restoring Backups**

To restore from a backup file:

**Using the restore script**:
```bash
./scripts/restore-database.sh backups/hotgigs_backup_20240101_120000.sql
```

**Manual restore**:
```bash
docker-compose exec -T mysql mysql -u hotgigs -photgigs_password hotgigs < backup_20240101_120000.sql
```

**Restore from compressed backup**:
```bash
gunzip < backup_20240101_120000.sql.gz | docker-compose exec -T mysql mysql -u hotgigs -photgigs_password hotgigs
```

**Automated Backup Schedule**

Set up automated daily backups using cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hotgigs-platform && ./scripts/backup-database.sh
```

### Database Management

**Access MySQL Shell**:
```bash
docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs
```

**Common MySQL Commands**:
```sql
-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE users;

-- Count records
SELECT COUNT(*) FROM candidates;

-- View recent applications
SELECT * FROM applications ORDER BY createdAt DESC LIMIT 10;

-- Check database size
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'hotgigs'
GROUP BY table_schema;
```

**Access phpMyAdmin**:
- URL: http://localhost:8080
- Server: `mysql`
- Username: `root`
- Password: `root_password`

phpMyAdmin provides a graphical interface for database management including browsing tables, running queries, importing/exporting data, and managing users and permissions.

## Production Deployment

### Production Docker Compose

For production deployments, create a separate `docker-compose.prod.yml` file with production-optimized settings:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: hotgigs
      MYSQL_USER: hotgigs
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  mysql_data:
  redis_data:
```

Deploy using:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options

**AWS Deployment**:
- **Application**: Deploy on EC2 instances or ECS containers
- **Database**: Use RDS for MySQL with automated backups
- **Storage**: Use S3 for file storage
- **Cache**: Use ElastiCache for Redis
- **Load Balancer**: Use ALB for traffic distribution

**Google Cloud Deployment**:
- **Application**: Deploy on Compute Engine or Cloud Run
- **Database**: Use Cloud SQL for MySQL
- **Storage**: Use Cloud Storage for files
- **Cache**: Use Memorystore for Redis
- **Load Balancer**: Use Cloud Load Balancing

**Azure Deployment**:
- **Application**: Deploy on Virtual Machines or Container Instances
- **Database**: Use Azure Database for MySQL
- **Storage**: Use Azure Blob Storage
- **Cache**: Use Azure Cache for Redis
- **Load Balancer**: Use Azure Load Balancer

### Reverse Proxy Configuration

For production deployments, use Nginx as a reverse proxy for SSL termination and load balancing.

**Nginx Configuration** (`/etc/nginx/sites-available/hotgigs`):
```nginx
upstream hotgigs_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name hotgigs.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hotgigs.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/hotgigs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hotgigs.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://hotgigs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/hotgigs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup

Use Let's Encrypt for free SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d hotgigs.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Process Management

Use systemd to manage the application as a service:

**Create service file** (`/etc/systemd/system/hotgigs.service`):
```ini
[Unit]
Description=HotGigs AI-Powered Recruitment Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/hotgigs-platform
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable hotgigs
sudo systemctl start hotgigs
sudo systemctl status hotgigs
```

## Monitoring & Maintenance

### Health Monitoring

The platform includes built-in health check endpoints for monitoring service status.

**Application Health Check**:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "available"
  }
}
```

**Using the status script**:
```bash
./scripts/status.sh
```

This provides comprehensive status information including service health, resource usage, database connectivity, and recent errors.

### Log Management

**View application logs**:
```bash
docker-compose logs -f app
```

**View database logs**:
```bash
docker-compose logs -f mysql
```

**Export logs to file**:
```bash
docker-compose logs app > app_logs_$(date +%Y%m%d).log
```

**Log rotation configuration** (`/etc/logrotate.d/hotgigs`):
```
/var/log/hotgigs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        docker-compose restart app
    endscript
}
```

### Performance Monitoring

Monitor resource usage and performance metrics:

**Docker stats**:
```bash
docker stats
```

**Database performance**:
```sql
-- Slow query log
SHOW VARIABLES LIKE 'slow_query_log%';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Active connections
SHOW PROCESSLIST;

-- Table sizes
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'hotgigs'
ORDER BY (data_length + index_length) DESC;
```

### Update Procedures

**Updating the application**:
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build app

# Restart services
docker-compose up -d app

# Run migrations
docker-compose exec app pnpm db:push
```

**Rolling back updates**:
```bash
# Revert to previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose build app
docker-compose up -d app
```

## Troubleshooting

### Common Issues and Solutions

**Issue: Database connection fails**

Symptoms: Application logs show "Error: connect ECONNREFUSED" or "Database connection failed"

Solutions:
1. Verify MySQL container is running: `docker-compose ps mysql`
2. Check MySQL logs: `docker-compose logs mysql`
3. Verify DATABASE_URL in .env matches container configuration
4. Wait for MySQL to fully initialize (can take 30-60 seconds on first start)
5. Test connection manually: `docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs`

**Issue: Port already in use**

Symptoms: "Error: listen EADDRINUSE: address already in use :::3000"

Solutions:
1. Check what's using the port: `lsof -i :3000` or `netstat -tulpn | grep 3000`
2. Stop the conflicting service or change the port in docker-compose.yml
3. Kill the process: `kill -9 <PID>`

**Issue: Out of memory errors**

Symptoms: Application crashes with "JavaScript heap out of memory"

Solutions:
1. Increase Node.js memory limit in Dockerfile: `NODE_OPTIONS="--max-old-space-size=4096"`
2. Increase Docker container memory limit in docker-compose.yml
3. Check for memory leaks in application code
4. Restart services to clear memory: `docker-compose restart`

**Issue: Migrations fail**

Symptoms: "Error: Table already exists" or "Migration failed"

Solutions:
1. Check current schema: `docker-compose exec mysql mysql -u hotgigs -photgigs_password hotgigs -e "SHOW TABLES;"`
2. Drop and recreate database (caution: data loss): `docker-compose exec mysql mysql -u root -proot_password -e "DROP DATABASE hotgigs; CREATE DATABASE hotgigs;"`
3. Re-run migrations: `docker-compose exec app pnpm db:push`
4. Check migration files for syntax errors

**Issue: File uploads fail**

Symptoms: "Error uploading file" or "Storage service unavailable"

Solutions:
1. Verify MinIO container is running: `docker-compose ps minio`
2. Check MinIO logs: `docker-compose logs minio`
3. Verify S3 credentials in .env file
4. Test MinIO access: http://localhost:9001
5. Check file size limits in application configuration

**Issue: AI features not working**

Symptoms: "OpenAI API error" or "AI service unavailable"

Solutions:
1. Verify OPENAI_API_KEY is set correctly in .env
2. Check API key validity at https://platform.openai.com/api-keys
3. Verify API quota and billing status
4. Check application logs for specific error messages
5. Test API key with curl: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Diagnostic Commands

**Check all service status**:
```bash
./scripts/status.sh
```

**Test database connectivity**:
```bash
docker-compose exec app node -e "const mysql = require('mysql2/promise'); mysql.createConnection(process.env.DATABASE_URL).then(() => console.log('Connected')).catch(err => console.error(err));"
```

**Verify environment variables**:
```bash
docker-compose exec app printenv | grep -E "(DATABASE|JWT|OPENAI|SENDGRID)"
```

**Check disk space**:
```bash
df -h
docker system df
```

**Clean up Docker resources**:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete cleanup (caution)
docker system prune -a --volumes
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check application logs**: `docker-compose logs -f app`
2. **Review GitHub issues**: https://github.com/businessintelli/hotgigscom/issues
3. **Consult documentation**: Review README.md and other documentation files
4. **Community support**: Join our community forum or Slack channel
5. **Professional support**: Contact support@hotgigs.com for enterprise support

### Performance Optimization

**Database optimization**:
```sql
-- Analyze tables
ANALYZE TABLE users, candidates, jobs, applications;

-- Optimize tables
OPTIMIZE TABLE users, candidates, jobs, applications;

-- Add indexes for frequently queried columns
CREATE INDEX idx_candidates_skills ON candidates(skills(255));
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_status ON applications(status);
```

**Application optimization**:
- Enable Redis caching for frequently accessed data
- Implement pagination for large result sets
- Use database connection pooling
- Optimize image sizes and formats
- Enable gzip compression in Nginx
- Use CDN for static assets

---

## Additional Resources

- **GitHub Repository**: https://github.com/businessintelli/hotgigscom
- **Installation Guide**: See INSTALLATION.md for detailed setup instructions
- **API Documentation**: See API.md for tRPC endpoint documentation
- **Contributing Guide**: See CONTRIBUTING.md for development guidelines
- **License**: MIT License - see LICENSE file for details

---

**Document Version**: 2.0  
**Last Updated**: December 19, 2025  
**Maintained By**: HotGigs Development Team

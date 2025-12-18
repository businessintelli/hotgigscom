# HotGigs Platform - Docker Setup Guide

This guide covers local development setup using Docker Compose and production container deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Services Overview](#services-overview)
4. [Configuration](#configuration)
5. [Development Workflow](#development-workflow)
6. [Production Build](#production-build)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Docker | 24.0+ | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |

### Verify Installation

```bash
docker --version
docker compose version
git --version
```

---

## Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/businessintelli/hotgigscom.git
cd hotgigscom
```

### Step 2: Create Environment File

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Step 3: Start Services

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### Step 4: Initialize Database

```bash
# Run database migrations
docker compose exec app pnpm db:push

# (Optional) Seed demo data
docker compose exec app pnpm db:seed
```

### Step 5: Access Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| phpMyAdmin | http://localhost:8080 | root / root_password |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |

---

## Services Overview

### Application Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HotGigs    │  │    MySQL     │  │    Redis     │      │
│  │     App      │  │     8.0      │  │   7-alpine   │      │
│  │  Port 3000   │  │  Port 3306   │  │  Port 6379   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  phpMyAdmin  │  │    MinIO     │                        │
│  │  Port 8080   │  │ Ports 9000/1 │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Service Details

| Service | Image | Purpose | Persistent Data |
|---------|-------|---------|-----------------|
| app | Custom build | Node.js application | None (code mounted) |
| mysql | mysql:8.0 | Primary database | mysql_data volume |
| redis | redis:7-alpine | Session/cache storage | redis_data volume |
| phpmyadmin | phpmyadmin:latest | Database management UI | None |
| minio | minio/minio:latest | S3-compatible storage | minio_data volume |

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ===========================================
# Application Settings
# ===========================================
NODE_ENV=development
PORT=3000

# ===========================================
# Database (Docker MySQL)
# ===========================================
DATABASE_URL=mysql://hotgigs:hotgigs_password@mysql:3306/hotgigs

# ===========================================
# Authentication
# ===========================================
JWT_SECRET=your-development-jwt-secret-minimum-32-characters

# ===========================================
# Redis (Optional)
# ===========================================
REDIS_URL=redis://redis:6379

# ===========================================
# MinIO S3 Storage (Local Development)
# ===========================================
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET=hotgigs-uploads
S3_REGION=us-east-1

# ===========================================
# Email (Optional for development)
# ===========================================
# RESEND_API_KEY=re_xxxx
# SENDGRID_API_KEY=SG.xxxx

# ===========================================
# AI/LLM Integration (Optional)
# ===========================================
# BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
# BUILT_IN_FORGE_API_KEY=sk-xxxx
```

### Docker Compose Profiles

```bash
# Start only essential services (app, mysql)
docker compose up -d app mysql

# Start with all development tools
docker compose up -d

# Start specific services
docker compose up -d mysql redis
```

---

## Development Workflow

### Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild application container
docker compose build app
docker compose up -d app

# View application logs
docker compose logs -f app

# Execute commands in app container
docker compose exec app pnpm install
docker compose exec app pnpm db:push
docker compose exec app pnpm test

# Access MySQL CLI
docker compose exec mysql mysql -u hotgigs -photgigs_password hotgigs

# Access Redis CLI
docker compose exec redis redis-cli
```

### Hot Reloading

The application container mounts the source code as a volume, enabling hot reloading during development:

```yaml
volumes:
  - .:/app
  - /app/node_modules  # Preserve container's node_modules
```

Changes to source files will automatically trigger a rebuild.

### Database Management

```bash
# Run migrations
docker compose exec app pnpm db:push

# Generate migration files
docker compose exec app pnpm drizzle-kit generate

# Access phpMyAdmin
open http://localhost:8080
```

### File Storage (MinIO)

```bash
# Access MinIO Console
open http://localhost:9001

# Create bucket via CLI
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin123
docker compose exec minio mc mb local/hotgigs-uploads
```

---

## Production Build

### Build Production Image

```bash
# Build the production image
docker build -t hotgigs:latest .

# Build with specific tag
docker build -t hotgigs:v1.0.0 .

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t hotgigs:latest .
```

### Run Production Container

```bash
# Run with environment variables
docker run -d \
  --name hotgigs \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your-production-secret" \
  hotgigs:latest

# Run with env file
docker run -d \
  --name hotgigs \
  -p 3000:3000 \
  --env-file .env.production \
  hotgigs:latest
```

### Push to Container Registry

```bash
# Docker Hub
docker tag hotgigs:latest username/hotgigs:latest
docker push username/hotgigs:latest

# AWS ECR
aws ecr get-login-password | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com
docker tag hotgigs:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/hotgigs:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/hotgigs:latest

# Google Container Registry
gcloud auth configure-docker
docker tag hotgigs:latest gcr.io/PROJECT_ID/hotgigs:latest
docker push gcr.io/PROJECT_ID/hotgigs:latest

# Azure Container Registry
az acr login --name REGISTRY_NAME
docker tag hotgigs:latest REGISTRY_NAME.azurecr.io/hotgigs:latest
docker push REGISTRY_NAME.azurecr.io/hotgigs:latest
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Container won't start | Port conflict | Change port mapping in docker-compose.yml |
| Database connection failed | MySQL not ready | Wait for healthcheck or increase start_period |
| Permission denied | Volume ownership | Run `chown -R 1001:1001 .` on host |
| Out of disk space | Docker volumes | Run `docker system prune -a` |

### Debugging Commands

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs -f [service_name]

# Inspect container
docker inspect hotgigs-app

# Check network connectivity
docker compose exec app ping mysql

# Check MySQL connection
docker compose exec app node -e "require('mysql2').createConnection(process.env.DATABASE_URL).connect(console.log)"

# View resource usage
docker stats
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker compose down -v --remove-orphans

# Remove all unused Docker resources
docker system prune -a --volumes

# Start fresh
docker compose up -d --build
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

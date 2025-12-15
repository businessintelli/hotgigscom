# HotGigs Platform - Railway Deployment Guide

Railway is a modern deployment platform that makes it easy to deploy, manage, and scale your applications. This guide covers deploying HotGigs to Railway with automatic CI/CD.

## Table of Contents

1. [Why Railway?](#why-railway)
2. [Prerequisites](#prerequisites)
3. [Quick Deploy](#quick-deploy)
4. [Manual Setup](#manual-setup)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Custom Domain](#custom-domain)
8. [CI/CD Integration](#cicd-integration)
9. [Monitoring & Logs](#monitoring--logs)
10. [Cost Estimation](#cost-estimation)

---

## Why Railway?

Railway offers several advantages for deploying HotGigs:

| Feature | Benefit |
|---------|---------|
| **One-click deploy** | Deploy directly from GitHub with zero configuration |
| **Automatic HTTPS** | Free SSL certificates for all deployments |
| **Built-in databases** | MySQL, PostgreSQL, Redis available as add-ons |
| **Preview environments** | Automatic deployments for pull requests |
| **Generous free tier** | $5/month free credits for hobby projects |
| **Simple scaling** | Horizontal and vertical scaling with one click |
| **GitHub integration** | Automatic deployments on push |

---

## Prerequisites

Before deploying to Railway, ensure you have:

1. A [Railway account](https://railway.app) (sign up with GitHub recommended)
2. The HotGigs repository on GitHub
3. Environment variables ready (see [Environment Variables](#environment-variables))

---

## Quick Deploy

### Option 1: Deploy Button

Click the button below to deploy HotGigs to Railway instantly:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/hotgigs)

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project (if applicable)
railway link

# Deploy
railway up
```

---

## Manual Setup

### Step 1: Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose the `businessintelli/hotgigscom` repository
5. Railway will automatically detect the project type

### Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Railway will provision a MySQL instance
4. Copy the connection string from the **"Connect"** tab

### Step 3: Configure Environment Variables

1. Click on your service (hotgigs)
2. Go to **"Variables"** tab
3. Add the required environment variables (see below)

### Step 4: Deploy

Railway will automatically deploy when you push to the connected branch. For manual deployment:

```bash
railway up
```

---

## Environment Variables

Configure these variables in Railway's dashboard under **Variables**:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `your-super-secret-jwt-key-here` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets automatically) | `3000` |
| `RESEND_API_KEY` | Email service API key | `re_xxxx` |
| `SENDGRID_API_KEY` | Alternative email service | `SG.xxxx` |
| `S3_BUCKET` | S3 bucket for file storage | `hotgigs-uploads` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | S3 access key | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `xxxx` |

### Using Railway's MySQL

When you add a MySQL database in Railway, it automatically provides these variables:

```
MYSQL_URL=mysql://root:password@host:port/railway
MYSQLHOST=host
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=password
MYSQLDATABASE=railway
```

Create a reference variable for `DATABASE_URL`:

```
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

---

## Database Setup

### Run Migrations

After deploying, run database migrations:

```bash
# Using Railway CLI
railway run pnpm db:push

# Or via Railway shell
railway shell
pnpm db:push
```

### Seed Database (Optional)

```bash
railway run pnpm db:seed
```

---

## Custom Domain

### Add Custom Domain

1. Go to your service **Settings**
2. Scroll to **"Domains"**
3. Click **"+ Custom Domain"**
4. Enter your domain (e.g., `hotgigs.com`)
5. Add the provided CNAME record to your DNS

### DNS Configuration

Add this CNAME record to your domain's DNS:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ or www | `your-service.up.railway.app` |

Railway automatically provisions SSL certificates.

---

## CI/CD Integration

### Automatic Deployments

Railway automatically deploys when you push to the connected branch. Configure in **Settings**:

| Setting | Recommended Value |
|---------|-------------------|
| Root Directory | `/` |
| Build Command | `pnpm install && pnpm build` |
| Start Command | `node dist/index.js` |
| Watch Paths | `/**` |

### GitHub Actions Integration

The repository includes a GitHub Actions workflow that deploys to Railway. To enable:

1. Get your Railway token: **Account Settings** → **Tokens** → **Create Token**
2. Add secret to GitHub: **Repository Settings** → **Secrets** → **RAILWAY_TOKEN**

### Preview Environments

Enable PR previews for testing:

1. Go to project **Settings**
2. Enable **"PR Environments"**
3. Each PR will get its own deployment URL

---

## Monitoring & Logs

### View Logs

```bash
# Via CLI
railway logs

# Or in dashboard
# Click on service → "Deployments" → Select deployment → "View Logs"
```

### Metrics

Railway provides built-in metrics:

- CPU usage
- Memory usage
- Network I/O
- Request count

Access via **Observability** tab in your service.

### Health Checks

The application includes a health endpoint at `/api/health`. Railway uses this for:

- Deployment verification
- Automatic restarts on failure
- Load balancer health checks

---

## Cost Estimation

### Pricing Tiers

| Tier | Price | Resources | Best For |
|------|-------|-----------|----------|
| **Hobby** | $5/month | 512MB RAM, shared CPU | Development, small projects |
| **Pro** | $20/month | 8GB RAM, 8 vCPU | Production workloads |
| **Team** | Custom | Unlimited | Enterprise |

### Estimated Monthly Costs

| Service | Configuration | Cost |
|---------|---------------|------|
| Web Service | Hobby (512MB) | ~$5/month |
| MySQL Database | 1GB storage | ~$5/month |
| **Total** | | **~$10/month** |

### Cost Optimization Tips

1. Use Railway's sleep feature for development environments
2. Monitor resource usage and right-size your services
3. Use the free tier for staging environments
4. Enable auto-scaling only when needed

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, ensure all dependencies are in package.json |
| Database connection error | Verify DATABASE_URL format and network access |
| Port binding error | Don't hardcode PORT, use `process.env.PORT` |
| Memory exceeded | Upgrade to higher tier or optimize application |

### Useful Commands

```bash
# Check deployment status
railway status

# View environment variables
railway variables

# Open deployed app
railway open

# SSH into container
railway shell

# Restart service
railway service restart
```

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

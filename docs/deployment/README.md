# HotGigs Platform - Deployment Documentation

Welcome to the HotGigs deployment documentation. This directory contains comprehensive guides for deploying the HotGigs AI-Powered Recruitment Platform across different environments and cloud providers.

## Quick Start

Choose your deployment target:

| Environment | Guide | Best For |
|-------------|-------|----------|
| [Docker](./DOCKER-SETUP.md) | Local development, containerized | Quick start, consistent environments |
| [Standalone Server](./STANDALONE-SETUP.md) | VPS, dedicated server, on-premises | Full control, cost-effective |
| [AWS](./AWS-DEPLOYMENT.md) | Amazon Web Services | Enterprise, scalability |
| [GCP](./GCP-DEPLOYMENT.md) | Google Cloud Platform | AI/ML integration, global reach |
| [Azure](./AZURE-DEPLOYMENT.md) | Microsoft Azure | Enterprise, Microsoft ecosystem |

## System Requirements Summary

### Software Dependencies

| Component | Version | Required |
|-----------|---------|----------|
| Node.js | 22.x | Yes |
| pnpm | 10.4.1 | Yes |
| MySQL | 8.0+ | Yes |
| Git | 2.x | Yes |

### Hardware Requirements

| Tier | CPU | RAM | Storage | Use Case |
|------|-----|-----|---------|----------|
| Development | 2 cores | 4 GB | 20 GB | Local testing |
| Production (Small) | 4 cores | 8 GB | 50 GB | < 1,000 users |
| Production (Medium) | 8 cores | 16 GB | 100 GB | 1,000-10,000 users |
| Production (Large) | 16+ cores | 32+ GB | 500+ GB | 10,000+ users |

## Environment Variables Reference

All deployments require the following environment variables:

### Required Variables

```bash
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-secure-jwt-secret-minimum-32-characters"

# Application
NODE_ENV="production"
PORT=3000
```

### Optional Variables

```bash
# Email Service (choose one)
RESEND_API_KEY="re_xxxx"
SENDGRID_API_KEY="SG.xxxx"

# AI/LLM Integration
BUILT_IN_FORGE_API_URL="https://api.openai.com/v1"
BUILT_IN_FORGE_API_KEY="sk-xxxx"

# File Storage (S3-compatible)
S3_BUCKET="bucket-name"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="xxxx"
S3_SECRET_ACCESS_KEY="xxxx"
S3_ENDPOINT="https://s3.amazonaws.com"

# OAuth (if using Manus OAuth)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/portal"
VITE_APP_ID="your-app-id"
```

## Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are configured
- [ ] Database is provisioned and accessible
- [ ] SSL certificate is installed
- [ ] Firewall rules are configured
- [ ] Backup strategy is in place
- [ ] Monitoring and alerting is configured
- [ ] Load balancer is configured (for HA)
- [ ] DNS records are pointing to your server

## Support

For deployment assistance or issues:
- GitHub Issues: https://github.com/businessintelli/hotgigscom/issues
- Documentation: https://github.com/businessintelli/hotgigscom/docs

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

# HotGigs Platform - AWS Deployment Guide

This guide provides comprehensive instructions for deploying the HotGigs AI-Powered Recruitment Platform on Amazon Web Services (AWS), covering multiple deployment architectures from simple EC2 instances to fully managed container orchestration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Option A: EC2 Deployment](#option-a-ec2-deployment)
4. [Option B: Elastic Beanstalk](#option-b-elastic-beanstalk)
5. [Option C: ECS with Fargate](#option-c-ecs-with-fargate)
6. [Database Setup (RDS)](#database-setup-rds)
7. [File Storage (S3)](#file-storage-s3)
8. [Load Balancing & SSL](#load-balancing--ssl)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Logging](#monitoring--logging)
11. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Route 53  │───▶│ CloudFront  │───▶│  Application Load   │ │
│  │   (DNS)     │    │   (CDN)     │    │     Balancer        │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                     ┌──────────────────────────────┼──────┐    │
│                     │         Auto Scaling Group   │      │    │
│  ┌──────────────────┼──────────────────────────────┼────┐ │    │
│  │  ┌───────────┐   │   ┌───────────┐   ┌─────────┴─┐  │ │    │
│  │  │   EC2     │   │   │   EC2     │   │    EC2    │  │ │    │
│  │  │ Instance  │   │   │ Instance  │   │  Instance │  │ │    │
│  │  └───────────┘   │   └───────────┘   └───────────┘  │ │    │
│  └──────────────────┼──────────────────────────────────┘ │    │
│                     └────────────────────────────────────┘    │
│                                    │                           │
│         ┌──────────────────────────┼──────────────────┐       │
│         │                          │                  │       │
│  ┌──────▼──────┐    ┌──────────────▼───┐    ┌────────▼─────┐ │
│  │    RDS      │    │       S3         │    │  ElastiCache │ │
│  │  (MySQL)    │    │   (Storage)      │    │   (Redis)    │ │
│  └─────────────┘    └──────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Requirements

| Service | Purpose | Minimum Tier |
|---------|---------|--------------|
| EC2 | Application servers | t3.medium |
| RDS | MySQL database | db.t3.medium |
| S3 | File storage | Standard |
| ALB | Load balancing | Application LB |
| CloudFront | CDN (optional) | Standard |
| ElastiCache | Session cache (optional) | cache.t3.micro |

---

## Prerequisites

### AWS Account Setup

1. Create an AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Enable MFA on root account
3. Create an IAM user with programmatic access
4. Install and configure AWS CLI:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# Enter your Access Key ID, Secret Access Key, and default region
```

### Required IAM Permissions

Create an IAM policy with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "rds:*",
                "s3:*",
                "elasticloadbalancing:*",
                "autoscaling:*",
                "cloudwatch:*",
                "logs:*",
                "secretsmanager:*",
                "acm:*"
            ],
            "Resource": "*"
        }
    ]
}
```

---

## Option A: EC2 Deployment

### Step 1: Create VPC and Security Groups

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=hotgigs-vpc}]'

# Create security group for web servers
aws ec2 create-security-group \
    --group-name hotgigs-web-sg \
    --description "Security group for HotGigs web servers" \
    --vpc-id vpc-xxxxxxxx

# Allow HTTP, HTTPS, and SSH
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 22 --cidr YOUR_IP/32
```

### Step 2: Launch EC2 Instance

```bash
# Launch instance with Amazon Linux 2023
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxxxx \
    --subnet-id subnet-xxxxxxxx \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hotgigs-web}]' \
    --user-data file://user-data.sh
```

### Step 3: User Data Script (user-data.sh)

```bash
#!/bin/bash
set -e

# Update system
yum update -y

# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs

# Install pnpm
npm install -g pnpm@10.4.1

# Install Git
yum install -y git

# Create application directory
mkdir -p /opt/hotgigs
cd /opt/hotgigs

# Clone repository
git clone https://github.com/businessintelli/hotgigscom.git .

# Install dependencies
pnpm install

# Build application
pnpm build

# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name hotgigs
pm2 save
pm2 startup
```

### Step 4: Connect and Configure

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Configure environment variables
sudo nano /opt/hotgigs/.env
# Add all required environment variables (see standalone guide)

# Restart application
pm2 restart hotgigs
```

---

## Option B: Elastic Beanstalk

Elastic Beanstalk provides a managed platform for deploying applications.

### Step 1: Install EB CLI

```bash
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd /path/to/hotgigs
eb init

# Select region
# Select platform: Node.js 22
# Create new application: hotgigs
```

### Step 3: Create Environment Configuration

Create `.ebextensions/nodecommand.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 22.13.0
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 80
    LowerThreshold: 20
```

Create `.ebextensions/packages.config`:

```yaml
packages:
  yum:
    git: []
```

### Step 4: Create Procfile

```
web: npm start
```

### Step 5: Deploy

```bash
# Create environment
eb create hotgigs-production --instance-type t3.medium --database.engine mysql --database.instance db.t3.medium

# Deploy
eb deploy

# Open in browser
eb open
```

---

## Option C: ECS with Fargate

### Step 1: Create Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.4.1
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Step 2: Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name hotgigs

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t hotgigs .
docker tag hotgigs:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hotgigs:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/hotgigs:latest
```

### Step 3: Create ECS Task Definition

```json
{
  "family": "hotgigs",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "hotgigs",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/hotgigs:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:hotgigs/database"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hotgigs",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Create ECS Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name hotgigs-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
    --cluster hotgigs-cluster \
    --service-name hotgigs-service \
    --task-definition hotgigs \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Database Setup (RDS)

### Create RDS MySQL Instance

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name hotgigs-db-subnet \
    --db-subnet-group-description "Subnet group for HotGigs RDS" \
    --subnet-ids subnet-xxx subnet-yyy

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier hotgigs-db \
    --db-instance-class db.t3.medium \
    --engine mysql \
    --engine-version 8.0 \
    --master-username admin \
    --master-user-password YOUR_SECURE_PASSWORD \
    --allocated-storage 100 \
    --storage-type gp3 \
    --vpc-security-group-ids sg-xxx \
    --db-subnet-group-name hotgigs-db-subnet \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

### RDS Configuration

| Parameter | Value |
|-----------|-------|
| Instance Class | db.t3.medium (minimum) |
| Storage | 100 GB gp3 |
| Multi-AZ | Yes (production) |
| Backup Retention | 7 days |
| Encryption | Enabled |

---

## File Storage (S3)

### Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://hotgigs-storage-YOUR_ACCOUNT_ID --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket hotgigs-storage-YOUR_ACCOUNT_ID \
    --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors --bucket hotgigs-storage-YOUR_ACCOUNT_ID --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://your-domain.com"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'
```

### S3 Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::hotgigs-storage-YOUR_ACCOUNT_ID/public/*"
        }
    ]
}
```

---

## Load Balancing & SSL

### Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name hotgigs-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxx \
    --scheme internet-facing \
    --type application

# Create target group
aws elbv2 create-target-group \
    --name hotgigs-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-xxx \
    --health-check-path /api/health \
    --target-type instance

# Request SSL certificate
aws acm request-certificate \
    --domain-name your-domain.com \
    --validation-method DNS \
    --subject-alternative-names www.your-domain.com

# Create HTTPS listener
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:... \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=arn:aws:acm:... \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## CI/CD Pipeline

### AWS CodePipeline Configuration

Create `buildspec.yml`:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 22
    commands:
      - npm install -g pnpm@10.4.1
  pre_build:
    commands:
      - pnpm install
      - pnpm test
  build:
    commands:
      - pnpm build
  post_build:
    commands:
      - aws s3 sync dist/ s3://hotgigs-artifacts/

artifacts:
  files:
    - '**/*'
  base-directory: dist

cache:
  paths:
    - node_modules/**/*
```

---

## Monitoring & Logging

### CloudWatch Configuration

```bash
# Create log group
aws logs create-log-group --log-group-name /hotgigs/application

# Create metric alarm for CPU
aws cloudwatch put-metric-alarm \
    --alarm-name hotgigs-high-cpu \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT:alerts
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| EC2 (2x t3.medium) | On-demand | ~$60/month |
| RDS (db.t3.medium) | Multi-AZ | ~$130/month |
| ALB | Standard | ~$20/month |
| S3 (50GB) | Standard | ~$2/month |
| Data Transfer | 100GB | ~$9/month |
| **Total** | | **~$220/month** |

### Cost Saving Tips

1. Use Reserved Instances for 1-3 year commitments (up to 72% savings)
2. Enable S3 Intelligent-Tiering for automatic cost optimization
3. Use Spot Instances for non-critical workloads
4. Implement auto-scaling to match demand

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

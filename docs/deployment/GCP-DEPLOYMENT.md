# HotGigs Platform - Google Cloud Platform Deployment Guide

This guide provides comprehensive instructions for deploying the HotGigs AI-Powered Recruitment Platform on Google Cloud Platform (GCP), covering multiple deployment options from Compute Engine to fully managed Cloud Run.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Option A: Compute Engine](#option-a-compute-engine)
4. [Option B: Cloud Run](#option-b-cloud-run)
5. [Option C: Google Kubernetes Engine](#option-c-google-kubernetes-engine)
6. [Database Setup (Cloud SQL)](#database-setup-cloud-sql)
7. [File Storage (Cloud Storage)](#file-storage-cloud-storage)
8. [Load Balancing & SSL](#load-balancing--ssl)
9. [CI/CD with Cloud Build](#cicd-with-cloud-build)
10. [Monitoring & Logging](#monitoring--logging)
11. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Cloud DNS  │───▶│  Cloud CDN  │───▶│   Cloud Load        │ │
│  │             │    │             │    │   Balancer          │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                     ┌──────────────────────────────┼──────┐    │
│                     │    Managed Instance Group    │      │    │
│  ┌──────────────────┼──────────────────────────────┼────┐ │    │
│  │  ┌───────────┐   │   ┌───────────┐   ┌─────────┴─┐  │ │    │
│  │  │  Compute  │   │   │  Compute  │   │  Compute  │  │ │    │
│  │  │  Engine   │   │   │  Engine   │   │  Engine   │  │ │    │
│  │  └───────────┘   │   └───────────┘   └───────────┘  │ │    │
│  └──────────────────┼──────────────────────────────────┘ │    │
│                     └────────────────────────────────────┘    │
│                                    │                           │
│         ┌──────────────────────────┼──────────────────┐       │
│         │                          │                  │       │
│  ┌──────▼──────┐    ┌──────────────▼───┐    ┌────────▼─────┐ │
│  │  Cloud SQL  │    │  Cloud Storage   │    │  Memorystore │ │
│  │  (MySQL)    │    │     (GCS)        │    │   (Redis)    │ │
│  └─────────────┘    └──────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Requirements

| Service | Purpose | Minimum Tier |
|---------|---------|--------------|
| Compute Engine | Application servers | e2-medium |
| Cloud SQL | MySQL database | db-g1-small |
| Cloud Storage | File storage | Standard |
| Cloud Load Balancing | Traffic distribution | HTTP(S) LB |
| Cloud CDN | Content delivery (optional) | Standard |
| Memorystore | Session cache (optional) | Basic tier |

---

## Prerequisites

### GCP Account Setup

1. Create a GCP account at [cloud.google.com](https://cloud.google.com)
2. Create a new project or select existing one
3. Enable billing for the project
4. Install and configure Google Cloud SDK:

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Restart shell
exec -l $SHELL

# Initialize gcloud
gcloud init

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
    compute.googleapis.com \
    sqladmin.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    secretmanager.googleapis.com
```

### Required IAM Roles

Ensure your service account has these roles:
- `roles/compute.admin`
- `roles/cloudsql.admin`
- `roles/storage.admin`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.admin`

---

## Option A: Compute Engine

### Step 1: Create VPC Network

```bash
# Create VPC
gcloud compute networks create hotgigs-vpc --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create hotgigs-subnet \
    --network=hotgigs-vpc \
    --region=us-central1 \
    --range=10.0.0.0/24

# Create firewall rules
gcloud compute firewall-rules create hotgigs-allow-http \
    --network=hotgigs-vpc \
    --allow=tcp:80,tcp:443,tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=hotgigs-web

gcloud compute firewall-rules create hotgigs-allow-internal \
    --network=hotgigs-vpc \
    --allow=tcp:0-65535,udp:0-65535,icmp \
    --source-ranges=10.0.0.0/24
```

### Step 2: Create Instance Template

```bash
# Create startup script
cat > startup-script.sh << 'EOF'
#!/bin/bash
set -e

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@10.4.1

# Install Git and other dependencies
apt-get install -y git

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

# Get secrets from Secret Manager
export DATABASE_URL=$(gcloud secrets versions access latest --secret=hotgigs-database-url)
export JWT_SECRET=$(gcloud secrets versions access latest --secret=hotgigs-jwt-secret)

# Create .env file
cat > .env << ENVEOF
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PORT=3000
ENVEOF

# Start application
pm2 start dist/index.js --name hotgigs
pm2 save
pm2 startup systemd -u root --hp /root
EOF

# Create instance template
gcloud compute instance-templates create hotgigs-template \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --network=hotgigs-vpc \
    --subnet=hotgigs-subnet \
    --tags=hotgigs-web \
    --metadata-from-file=startup-script=startup-script.sh \
    --scopes=cloud-platform
```

### Step 3: Create Managed Instance Group

```bash
# Create managed instance group
gcloud compute instance-groups managed create hotgigs-mig \
    --template=hotgigs-template \
    --size=2 \
    --zone=us-central1-a

# Configure autoscaling
gcloud compute instance-groups managed set-autoscaling hotgigs-mig \
    --zone=us-central1-a \
    --min-num-replicas=2 \
    --max-num-replicas=10 \
    --target-cpu-utilization=0.7 \
    --cool-down-period=300
```

---

## Option B: Cloud Run

Cloud Run provides a fully managed serverless platform.

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
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]
```

### Step 2: Build and Deploy

```bash
# Build container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hotgigs

# Deploy to Cloud Run
gcloud run deploy hotgigs \
    --image=gcr.io/YOUR_PROJECT_ID/hotgigs \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=100 \
    --set-env-vars="NODE_ENV=production" \
    --set-secrets="DATABASE_URL=hotgigs-database-url:latest,JWT_SECRET=hotgigs-jwt-secret:latest" \
    --vpc-connector=hotgigs-connector \
    --vpc-egress=all-traffic
```

### Step 3: Configure VPC Connector (for Cloud SQL)

```bash
# Create VPC connector for Cloud SQL access
gcloud compute networks vpc-access connectors create hotgigs-connector \
    --region=us-central1 \
    --network=hotgigs-vpc \
    --range=10.8.0.0/28
```

---

## Option C: Google Kubernetes Engine

### Step 1: Create GKE Cluster

```bash
# Create GKE cluster
gcloud container clusters create hotgigs-cluster \
    --zone=us-central1-a \
    --num-nodes=3 \
    --machine-type=e2-medium \
    --enable-autoscaling \
    --min-nodes=2 \
    --max-nodes=10 \
    --network=hotgigs-vpc \
    --subnetwork=hotgigs-subnet

# Get credentials
gcloud container clusters get-credentials hotgigs-cluster --zone=us-central1-a
```

### Step 2: Create Kubernetes Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hotgigs
  labels:
    app: hotgigs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hotgigs
  template:
    metadata:
      labels:
        app: hotgigs
    spec:
      containers:
      - name: hotgigs
        image: gcr.io/YOUR_PROJECT_ID/hotgigs:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hotgigs-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: hotgigs-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hotgigs-service
spec:
  type: LoadBalancer
  selector:
    app: hotgigs
  ports:
  - port: 80
    targetPort: 3000
```

### Step 3: Deploy to GKE

```bash
# Create secrets
kubectl create secret generic hotgigs-secrets \
    --from-literal=database-url='mysql://...' \
    --from-literal=jwt-secret='your-jwt-secret'

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

---

## Database Setup (Cloud SQL)

### Create Cloud SQL Instance

```bash
# Create Cloud SQL MySQL instance
gcloud sql instances create hotgigs-db \
    --database-version=MYSQL_8_0 \
    --tier=db-g1-small \
    --region=us-central1 \
    --storage-size=100GB \
    --storage-type=SSD \
    --storage-auto-increase \
    --backup-start-time=02:00 \
    --enable-bin-log \
    --availability-type=REGIONAL

# Set root password
gcloud sql users set-password root \
    --host=% \
    --instance=hotgigs-db \
    --password=YOUR_ROOT_PASSWORD

# Create database
gcloud sql databases create hotgigs --instance=hotgigs-db

# Create application user
gcloud sql users create hotgigs \
    --instance=hotgigs-db \
    --password=YOUR_APP_PASSWORD
```

### Connection Configuration

| Connection Type | Configuration |
|-----------------|---------------|
| Private IP | Enable private IP in Cloud SQL settings |
| Cloud SQL Proxy | Use for local development |
| VPC Connector | Required for Cloud Run |

### Connection String Format

```
mysql://hotgigs:password@/hotgigs?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

---

## File Storage (Cloud Storage)

### Create Storage Bucket

```bash
# Create bucket
gsutil mb -l us-central1 gs://hotgigs-storage-YOUR_PROJECT_ID

# Set lifecycle policy
cat > lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://hotgigs-storage-YOUR_PROJECT_ID

# Configure CORS
cat > cors.json << 'EOF'
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://hotgigs-storage-YOUR_PROJECT_ID

# Make public folder accessible
gsutil iam ch allUsers:objectViewer gs://hotgigs-storage-YOUR_PROJECT_ID/public
```

---

## Load Balancing & SSL

### Create HTTPS Load Balancer

```bash
# Reserve static IP
gcloud compute addresses create hotgigs-ip --global

# Create health check
gcloud compute health-checks create http hotgigs-health \
    --port=3000 \
    --request-path=/api/health

# Create backend service
gcloud compute backend-services create hotgigs-backend \
    --protocol=HTTP \
    --health-checks=hotgigs-health \
    --global

# Add instance group to backend
gcloud compute backend-services add-backend hotgigs-backend \
    --instance-group=hotgigs-mig \
    --instance-group-zone=us-central1-a \
    --global

# Create URL map
gcloud compute url-maps create hotgigs-lb \
    --default-service=hotgigs-backend

# Create managed SSL certificate
gcloud compute ssl-certificates create hotgigs-cert \
    --domains=your-domain.com,www.your-domain.com \
    --global

# Create HTTPS proxy
gcloud compute target-https-proxies create hotgigs-https-proxy \
    --url-map=hotgigs-lb \
    --ssl-certificates=hotgigs-cert

# Create forwarding rule
gcloud compute forwarding-rules create hotgigs-https-rule \
    --address=hotgigs-ip \
    --global \
    --target-https-proxy=hotgigs-https-proxy \
    --ports=443
```

---

## CI/CD with Cloud Build

### Create cloudbuild.yaml

```yaml
steps:
  # Install dependencies
  - name: 'node:22'
    entrypoint: 'npm'
    args: ['install', '-g', 'pnpm@10.4.1']
  
  - name: 'node:22'
    entrypoint: 'pnpm'
    args: ['install']
  
  # Run tests
  - name: 'node:22'
    entrypoint: 'pnpm'
    args: ['test']
  
  # Build application
  - name: 'node:22'
    entrypoint: 'pnpm'
    args: ['build']
  
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/hotgigs:$COMMIT_SHA', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/hotgigs:$COMMIT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'hotgigs'
      - '--image=gcr.io/$PROJECT_ID/hotgigs:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

images:
  - 'gcr.io/$PROJECT_ID/hotgigs:$COMMIT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY
```

### Setup Build Trigger

```bash
# Create trigger for main branch
gcloud builds triggers create github \
    --repo-name=hotgigscom \
    --repo-owner=businessintelli \
    --branch-pattern=^main$ \
    --build-config=cloudbuild.yaml
```

---

## Monitoring & Logging

### Cloud Monitoring Setup

```bash
# Create uptime check
gcloud monitoring uptime-check-configs create hotgigs-uptime \
    --display-name="HotGigs Uptime" \
    --resource-type=uptime-url \
    --monitored-resource="type=uptime_url,host=your-domain.com,project_id=YOUR_PROJECT_ID"

# Create alerting policy
gcloud alpha monitoring policies create \
    --display-name="High CPU Alert" \
    --condition-display-name="CPU > 80%" \
    --condition-filter='resource.type="gce_instance" AND metric.type="compute.googleapis.com/instance/cpu/utilization"' \
    --condition-threshold-value=0.8 \
    --condition-threshold-duration=300s \
    --notification-channels=projects/YOUR_PROJECT_ID/notificationChannels/CHANNEL_ID
```

### Cloud Logging Queries

```
# Application errors
resource.type="cloud_run_revision"
resource.labels.service_name="hotgigs"
severity>=ERROR

# Request latency
resource.type="cloud_run_revision"
httpRequest.latency>"1s"
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| Compute Engine (2x e2-medium) | On-demand | ~$50/month |
| Cloud SQL (db-g1-small) | Regional HA | ~$80/month |
| Cloud Load Balancing | HTTP(S) LB | ~$20/month |
| Cloud Storage (50GB) | Standard | ~$1/month |
| Network Egress (100GB) | Standard | ~$12/month |
| **Total** | | **~$165/month** |

### Cost Saving Tips

1. Use Committed Use Discounts for 1-3 year commitments (up to 57% savings)
2. Use Preemptible VMs for non-critical workloads (up to 80% savings)
3. Enable Cloud CDN to reduce egress costs
4. Use Cloud Run for variable workloads (pay-per-request)
5. Schedule non-production instances to shut down outside business hours

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

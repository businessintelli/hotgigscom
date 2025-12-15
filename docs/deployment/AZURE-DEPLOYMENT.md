# HotGigs Platform - Microsoft Azure Deployment Guide

This guide provides comprehensive instructions for deploying the HotGigs AI-Powered Recruitment Platform on Microsoft Azure, covering multiple deployment options from Virtual Machines to fully managed Azure App Service and Azure Kubernetes Service.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Option A: Azure Virtual Machines](#option-a-azure-virtual-machines)
4. [Option B: Azure App Service](#option-b-azure-app-service)
5. [Option C: Azure Kubernetes Service](#option-c-azure-kubernetes-service)
6. [Database Setup (Azure Database for MySQL)](#database-setup-azure-database-for-mysql)
7. [File Storage (Azure Blob Storage)](#file-storage-azure-blob-storage)
8. [Load Balancing & SSL](#load-balancing--ssl)
9. [CI/CD with Azure DevOps](#cicd-with-azure-devops)
10. [Monitoring & Logging](#monitoring--logging)
11. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Microsoft Azure                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Azure DNS  │───▶│  Azure CDN  │───▶│  Application        │ │
│  │             │    │             │    │  Gateway            │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                                    │            │
│                     ┌──────────────────────────────┼──────┐    │
│                     │   Virtual Machine Scale Set  │      │    │
│  ┌──────────────────┼──────────────────────────────┼────┐ │    │
│  │  ┌───────────┐   │   ┌───────────┐   ┌─────────┴─┐  │ │    │
│  │  │   Azure   │   │   │   Azure   │   │   Azure   │  │ │    │
│  │  │    VM     │   │   │    VM     │   │    VM     │  │ │    │
│  │  └───────────┘   │   └───────────┘   └───────────┘  │ │    │
│  └──────────────────┼──────────────────────────────────┘ │    │
│                     └────────────────────────────────────┘    │
│                                    │                           │
│         ┌──────────────────────────┼──────────────────┐       │
│         │                          │                  │       │
│  ┌──────▼──────┐    ┌──────────────▼───┐    ┌────────▼─────┐ │
│  │ Azure DB    │    │  Azure Blob      │    │ Azure Cache  │ │
│  │ for MySQL   │    │  Storage         │    │ for Redis    │ │
│  └─────────────┘    └──────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Requirements

| Service | Purpose | Minimum Tier |
|---------|---------|--------------|
| Virtual Machines | Application servers | Standard_B2s |
| Azure Database for MySQL | Database | General Purpose |
| Blob Storage | File storage | Standard |
| Application Gateway | Load balancing | Standard_v2 |
| Azure CDN | Content delivery (optional) | Standard |
| Azure Cache for Redis | Session cache (optional) | Basic |

---

## Prerequisites

### Azure Account Setup

1. Create an Azure account at [azure.microsoft.com](https://azure.microsoft.com)
2. Create a subscription (Free tier available)
3. Install and configure Azure CLI:

```bash
# Install Azure CLI (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

### Create Resource Group

```bash
# Create resource group
az group create \
    --name hotgigs-rg \
    --location eastus

# Set default resource group
az configure --defaults group=hotgigs-rg location=eastus
```

---

## Option A: Azure Virtual Machines

### Step 1: Create Virtual Network

```bash
# Create VNet
az network vnet create \
    --name hotgigs-vnet \
    --address-prefix 10.0.0.0/16 \
    --subnet-name web-subnet \
    --subnet-prefix 10.0.1.0/24

# Create additional subnet for database
az network vnet subnet create \
    --vnet-name hotgigs-vnet \
    --name db-subnet \
    --address-prefix 10.0.2.0/24

# Create Network Security Group
az network nsg create --name hotgigs-nsg

# Add rules
az network nsg rule create \
    --nsg-name hotgigs-nsg \
    --name AllowHTTP \
    --priority 100 \
    --destination-port-ranges 80 443 \
    --access Allow \
    --protocol Tcp

az network nsg rule create \
    --nsg-name hotgigs-nsg \
    --name AllowSSH \
    --priority 110 \
    --destination-port-ranges 22 \
    --access Allow \
    --protocol Tcp \
    --source-address-prefixes YOUR_IP/32
```

### Step 2: Create Virtual Machine

```bash
# Create VM
az vm create \
    --name hotgigs-vm \
    --image Ubuntu2204 \
    --size Standard_B2s \
    --admin-username azureuser \
    --generate-ssh-keys \
    --vnet-name hotgigs-vnet \
    --subnet web-subnet \
    --nsg hotgigs-nsg \
    --public-ip-address hotgigs-ip \
    --custom-data cloud-init.yaml
```

### Step 3: Cloud-Init Configuration (cloud-init.yaml)

```yaml
#cloud-config
package_update: true
package_upgrade: true

packages:
  - git
  - curl
  - build-essential

runcmd:
  # Install Node.js 22
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y nodejs
  
  # Install pnpm
  - npm install -g pnpm@10.4.1
  
  # Create application directory
  - mkdir -p /opt/hotgigs
  - cd /opt/hotgigs
  
  # Clone repository
  - git clone https://github.com/businessintelli/hotgigscom.git .
  
  # Install dependencies
  - pnpm install
  
  # Build application
  - pnpm build
  
  # Install PM2
  - npm install -g pm2
  
  # Start application
  - pm2 start dist/index.js --name hotgigs
  - pm2 save
  - pm2 startup systemd -u root --hp /root
```

### Step 4: Create VM Scale Set

```bash
# Create scale set
az vmss create \
    --name hotgigs-vmss \
    --image Ubuntu2204 \
    --vm-sku Standard_B2s \
    --instance-count 2 \
    --admin-username azureuser \
    --generate-ssh-keys \
    --vnet-name hotgigs-vnet \
    --subnet web-subnet \
    --upgrade-policy-mode automatic \
    --custom-data cloud-init.yaml

# Configure autoscaling
az monitor autoscale create \
    --resource-group hotgigs-rg \
    --resource hotgigs-vmss \
    --resource-type Microsoft.Compute/virtualMachineScaleSets \
    --name hotgigs-autoscale \
    --min-count 2 \
    --max-count 10 \
    --count 2

# Add scale-out rule
az monitor autoscale rule create \
    --resource-group hotgigs-rg \
    --autoscale-name hotgigs-autoscale \
    --condition "Percentage CPU > 70 avg 5m" \
    --scale out 1

# Add scale-in rule
az monitor autoscale rule create \
    --resource-group hotgigs-rg \
    --autoscale-name hotgigs-autoscale \
    --condition "Percentage CPU < 30 avg 5m" \
    --scale in 1
```

---

## Option B: Azure App Service

Azure App Service provides a fully managed platform for web applications.

### Step 1: Create App Service Plan

```bash
# Create App Service Plan
az appservice plan create \
    --name hotgigs-plan \
    --sku P1v3 \
    --is-linux

# Create Web App
az webapp create \
    --name hotgigs-app \
    --plan hotgigs-plan \
    --runtime "NODE:22-lts"
```

### Step 2: Configure Deployment

```bash
# Configure deployment from GitHub
az webapp deployment source config \
    --name hotgigs-app \
    --repo-url https://github.com/businessintelli/hotgigscom \
    --branch main \
    --manual-integration

# Or use local Git deployment
az webapp deployment source config-local-git \
    --name hotgigs-app

# Configure startup command
az webapp config set \
    --name hotgigs-app \
    --startup-file "npm start"
```

### Step 3: Configure Environment Variables

```bash
# Set application settings
az webapp config appsettings set \
    --name hotgigs-app \
    --settings \
        NODE_ENV=production \
        PORT=8080 \
        DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://hotgigs-kv.vault.azure.net/secrets/database-url)" \
        JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://hotgigs-kv.vault.azure.net/secrets/jwt-secret)"
```

### Step 4: Enable Managed Identity

```bash
# Enable system-assigned managed identity
az webapp identity assign --name hotgigs-app

# Get the principal ID
PRINCIPAL_ID=$(az webapp identity show --name hotgigs-app --query principalId -o tsv)

# Grant access to Key Vault
az keyvault set-policy \
    --name hotgigs-kv \
    --object-id $PRINCIPAL_ID \
    --secret-permissions get list
```

---

## Option C: Azure Kubernetes Service

### Step 1: Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
    --name hotgigs-aks \
    --node-count 3 \
    --node-vm-size Standard_B2s \
    --enable-managed-identity \
    --generate-ssh-keys \
    --network-plugin azure \
    --vnet-subnet-id /subscriptions/SUB_ID/resourceGroups/hotgigs-rg/providers/Microsoft.Network/virtualNetworks/hotgigs-vnet/subnets/web-subnet

# Get credentials
az aks get-credentials --name hotgigs-aks

# Verify connection
kubectl get nodes
```

### Step 2: Create Azure Container Registry

```bash
# Create ACR
az acr create \
    --name hotgigsacr \
    --sku Basic

# Enable admin access
az acr update --name hotgigsacr --admin-enabled true

# Login to ACR
az acr login --name hotgigsacr

# Build and push image
az acr build \
    --registry hotgigsacr \
    --image hotgigs:latest \
    --file Dockerfile .

# Attach ACR to AKS
az aks update \
    --name hotgigs-aks \
    --attach-acr hotgigsacr
```

### Step 3: Create Kubernetes Manifests

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
        image: hotgigsacr.azurecr.io/hotgigs:latest
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
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hotgigs-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hotgigs
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Step 4: Deploy to AKS

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
kubectl get hpa
```

---

## Database Setup (Azure Database for MySQL)

### Create MySQL Flexible Server

```bash
# Create MySQL server
az mysql flexible-server create \
    --name hotgigs-mysql \
    --admin-user hotgigsadmin \
    --admin-password YOUR_SECURE_PASSWORD \
    --sku-name Standard_B2s \
    --tier Burstable \
    --storage-size 100 \
    --version 8.0.21 \
    --high-availability ZoneRedundant \
    --zone 1 \
    --standby-zone 2

# Create database
az mysql flexible-server db create \
    --server-name hotgigs-mysql \
    --database-name hotgigs

# Configure firewall (allow Azure services)
az mysql flexible-server firewall-rule create \
    --name AllowAzureServices \
    --server-name hotgigs-mysql \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Enable SSL
az mysql flexible-server parameter set \
    --server-name hotgigs-mysql \
    --name require_secure_transport \
    --value ON
```

### Connection Configuration

| Parameter | Value |
|-----------|-------|
| Host | hotgigs-mysql.mysql.database.azure.com |
| Port | 3306 |
| SSL | Required |
| Connection Pooling | Recommended |

### Connection String Format

```
mysql://hotgigsadmin:password@hotgigs-mysql.mysql.database.azure.com:3306/hotgigs?ssl=true
```

---

## File Storage (Azure Blob Storage)

### Create Storage Account

```bash
# Create storage account
az storage account create \
    --name hotgigsstorage \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot

# Create container
az storage container create \
    --name uploads \
    --account-name hotgigsstorage \
    --public-access blob

# Get connection string
az storage account show-connection-string \
    --name hotgigsstorage \
    --query connectionString -o tsv
```

### Configure CORS

```bash
az storage cors add \
    --account-name hotgigsstorage \
    --services b \
    --methods GET PUT POST DELETE \
    --origins "https://your-domain.com" \
    --allowed-headers "*" \
    --exposed-headers "*" \
    --max-age 3600
```

### Storage Configuration for Application

```javascript
// Azure Blob Storage configuration
const { BlobServiceClient } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerClient = blobServiceClient.getContainerClient('uploads');
```

---

## Load Balancing & SSL

### Create Application Gateway

```bash
# Create public IP
az network public-ip create \
    --name hotgigs-appgw-ip \
    --sku Standard \
    --allocation-method Static

# Create Application Gateway subnet
az network vnet subnet create \
    --vnet-name hotgigs-vnet \
    --name appgw-subnet \
    --address-prefix 10.0.3.0/24

# Create Application Gateway
az network application-gateway create \
    --name hotgigs-appgw \
    --location eastus \
    --capacity 2 \
    --sku Standard_v2 \
    --public-ip-address hotgigs-appgw-ip \
    --vnet-name hotgigs-vnet \
    --subnet appgw-subnet \
    --servers 10.0.1.4 10.0.1.5 \
    --http-settings-port 3000 \
    --http-settings-protocol Http \
    --frontend-port 443 \
    --routing-rule-type Basic
```

### Configure SSL Certificate

```bash
# Create Key Vault
az keyvault create \
    --name hotgigs-kv \
    --enable-soft-delete true

# Import SSL certificate
az keyvault certificate import \
    --vault-name hotgigs-kv \
    --name hotgigs-ssl \
    --file certificate.pfx \
    --password CERT_PASSWORD

# Or create managed certificate with App Service
az webapp config ssl bind \
    --name hotgigs-app \
    --certificate-thumbprint THUMBPRINT \
    --ssl-type SNI
```

---

## CI/CD with Azure DevOps

### Azure Pipelines Configuration

Create `azure-pipelines.yml`:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '22.x'
  azureSubscription: 'Your-Azure-Subscription'
  webAppName: 'hotgigs-app'

stages:
  - stage: Build
    displayName: 'Build stage'
    jobs:
      - job: Build
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
            displayName: 'Install Node.js'

          - script: |
              npm install -g pnpm@10.4.1
              pnpm install
              pnpm test
              pnpm build
            displayName: 'Install, test, and build'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
              includeRootFolder: false
              archiveType: 'zip'
              archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'

          - publish: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
            artifact: drop

  - stage: Deploy
    displayName: 'Deploy stage'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: Deploy
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'webAppLinux'
                    appName: '$(webAppName)'
                    package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
                    runtimeStack: 'NODE|22-lts'
```

### GitHub Actions Alternative

Create `.github/workflows/azure.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install pnpm
        run: npm install -g pnpm@10.4.1
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'hotgigs-app'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

---

## Monitoring & Logging

### Application Insights Setup

```bash
# Create Application Insights
az monitor app-insights component create \
    --app hotgigs-insights \
    --location eastus \
    --kind web \
    --application-type Node.JS

# Get instrumentation key
az monitor app-insights component show \
    --app hotgigs-insights \
    --query instrumentationKey -o tsv

# Link to Web App
az webapp config appsettings set \
    --name hotgigs-app \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY=YOUR_KEY
```

### Log Analytics Workspace

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
    --workspace-name hotgigs-logs

# Enable diagnostic settings
az monitor diagnostic-settings create \
    --name hotgigs-diagnostics \
    --resource /subscriptions/SUB_ID/resourceGroups/hotgigs-rg/providers/Microsoft.Web/sites/hotgigs-app \
    --workspace hotgigs-logs \
    --logs '[{"category":"AppServiceHTTPLogs","enabled":true},{"category":"AppServiceConsoleLogs","enabled":true}]'
```

### Alert Rules

```bash
# Create action group
az monitor action-group create \
    --name hotgigs-alerts \
    --short-name alerts \
    --email-receiver name=admin email=admin@example.com

# Create metric alert
az monitor metrics alert create \
    --name high-cpu-alert \
    --resource-group hotgigs-rg \
    --scopes /subscriptions/SUB_ID/resourceGroups/hotgigs-rg/providers/Microsoft.Web/sites/hotgigs-app \
    --condition "avg CpuPercentage > 80" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action hotgigs-alerts
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| App Service (P1v3) | Linux | ~$130/month |
| Azure DB for MySQL (B2s) | Zone Redundant | ~$90/month |
| Application Gateway (Standard_v2) | 2 capacity units | ~$180/month |
| Blob Storage (100GB) | Standard LRS | ~$2/month |
| Bandwidth (100GB) | Outbound | ~$9/month |
| **Total** | | **~$410/month** |

### Cost Saving Tips

1. Use Azure Reserved Instances for 1-3 year commitments (up to 72% savings)
2. Use Azure Spot VMs for non-critical workloads (up to 90% savings)
3. Enable autoscaling to match demand
4. Use Azure CDN to reduce bandwidth costs
5. Consider Azure Functions for event-driven workloads
6. Use Azure Hybrid Benefit if you have existing Windows Server licenses
7. Schedule dev/test environments to shut down outside business hours

### Azure Cost Management

```bash
# Set budget alert
az consumption budget create \
    --budget-name hotgigs-budget \
    --amount 500 \
    --time-grain Monthly \
    --start-date 2024-01-01 \
    --end-date 2025-12-31 \
    --category Cost
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

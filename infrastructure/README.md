# HotGigs Infrastructure as Code

This directory contains Infrastructure as Code (IaC) templates for deploying HotGigs to various cloud providers using both Terraform and Pulumi.

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── aws/          # AWS infrastructure with Terraform
│   ├── gcp/          # GCP infrastructure with Terraform
│   └── azure/        # Azure infrastructure with Terraform
└── pulumi/
    └── aws/          # AWS infrastructure with Pulumi (TypeScript)
```

## Terraform Deployments

### Prerequisites

1. Install Terraform (v1.0+): https://terraform.io/downloads
2. Configure cloud provider credentials
3. Create a `terraform.tfvars` file with required variables

### AWS Deployment

```bash
cd infrastructure/terraform/aws

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
aws_region   = "us-east-1"
environment  = "prod"
db_password  = "your-secure-password"
jwt_secret   = "your-jwt-secret-min-32-chars"
domain_name  = "hotgigs.com"  # Optional
EOF

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy (when needed)
terraform destroy
```

### GCP Deployment

```bash
cd infrastructure/terraform/gcp

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
project_id   = "your-gcp-project-id"
region       = "us-central1"
environment  = "prod"
db_password  = "your-secure-password"
jwt_secret   = "your-jwt-secret-min-32-chars"
EOF

# Preview and apply
terraform plan
terraform apply
```

### Azure Deployment

```bash
cd infrastructure/terraform/azure

# Login to Azure
az login

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
location     = "East US"
environment  = "prod"
db_password  = "your-secure-password"
jwt_secret   = "your-jwt-secret-min-32-chars"
EOF

# Preview and apply
terraform plan
terraform apply
```

## Pulumi Deployments

### Prerequisites

1. Install Pulumi: https://www.pulumi.com/docs/install/
2. Install Node.js 18+
3. Configure cloud provider credentials

### AWS Deployment with Pulumi

```bash
cd infrastructure/pulumi/aws

# Install dependencies
npm install

# Login to Pulumi (use local backend or Pulumi Cloud)
pulumi login --local  # or pulumi login

# Create a new stack
pulumi stack init prod

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set environment prod
pulumi config set --secret dbPassword "your-secure-password"
pulumi config set --secret jwtSecret "your-jwt-secret-min-32-chars"

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy (when needed)
pulumi destroy
```

## Resource Overview

### AWS Resources Created

| Resource | Description | Environment |
|----------|-------------|-------------|
| VPC | Virtual Private Cloud with public/private subnets | All |
| RDS MySQL | Managed MySQL 8.0 database | All |
| ECS Fargate | Containerized application hosting | All |
| ALB | Application Load Balancer | All |
| S3 | File storage bucket | All |
| ECR | Container image registry | All |
| CloudWatch | Logging and monitoring | All |
| Auto Scaling | Automatic capacity adjustment | Prod only |

### GCP Resources Created

| Resource | Description | Environment |
|----------|-------------|-------------|
| VPC | Virtual Private Cloud | All |
| Cloud SQL | Managed MySQL 8.0 database | All |
| Cloud Run | Serverless container hosting | All |
| Cloud Storage | File storage bucket | All |
| Artifact Registry | Container image registry | All |
| Secret Manager | Secrets management | All |

### Azure Resources Created

| Resource | Description | Environment |
|----------|-------------|-------------|
| Resource Group | Resource container | All |
| VNet | Virtual Network | All |
| MySQL Flexible Server | Managed MySQL 8.0 database | All |
| Container Apps | Serverless container hosting | All |
| Storage Account | File storage | All |
| Container Registry | Container image registry | All |
| Key Vault | Secrets management | All |
| Log Analytics | Logging and monitoring | All |

## Cost Estimation

### Development Environment (Monthly)

| Provider | Estimated Cost |
|----------|----------------|
| AWS | ~$50-80 |
| GCP | ~$40-70 |
| Azure | ~$50-80 |

### Production Environment (Monthly)

| Provider | Estimated Cost |
|----------|----------------|
| AWS | ~$200-400 |
| GCP | ~$150-300 |
| Azure | ~$200-400 |

*Costs vary based on traffic, storage, and data transfer.*

## Security Best Practices

1. **Secrets Management**: Never commit secrets to version control. Use environment variables or secret management services.

2. **Network Security**: All databases are deployed in private subnets with no public access.

3. **Encryption**: All data is encrypted at rest and in transit.

4. **IAM**: Follow the principle of least privilege for all service accounts.

5. **Monitoring**: Enable logging and set up alerts for security events.

## Troubleshooting

### Common Issues

**Terraform state lock**: If you encounter state lock issues, ensure no other Terraform processes are running, or use `terraform force-unlock`.

**Database connection**: Ensure the application security group has access to the database security group.

**Container startup**: Check CloudWatch/Cloud Logging for container startup errors.

### Getting Help

For issues with these IaC templates, please open an issue in the repository or contact the infrastructure team.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI

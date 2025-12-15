/**
 * HotGigs Platform - AWS Infrastructure with Pulumi
 * 
 * This Pulumi program provisions the complete AWS infrastructure
 * for running the HotGigs recruitment platform.
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// =============================================================================
// Configuration
// =============================================================================

const config = new pulumi.Config();
const environment = config.get("environment") || "prod";
const appName = config.get("appName") || "hotgigs";
const dbPassword = config.requireSecret("dbPassword");
const jwtSecret = config.requireSecret("jwtSecret");

const tags = {
  Project: "HotGigs",
  Environment: environment,
  ManagedBy: "Pulumi",
};

// =============================================================================
// VPC & Networking
// =============================================================================

const vpc = new awsx.ec2.Vpc(`${appName}-${environment}-vpc`, {
  cidrBlock: "10.0.0.0/16",
  numberOfAvailabilityZones: 2,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  natGateways: {
    strategy: environment === "prod" ? awsx.ec2.NatGatewayStrategy.OnePerAz : awsx.ec2.NatGatewayStrategy.Single,
  },
  tags: { ...tags, Name: `${appName}-${environment}-vpc` },
});

// =============================================================================
// Security Groups
// =============================================================================

const albSecurityGroup = new aws.ec2.SecurityGroup(`${appName}-${environment}-alb-sg`, {
  vpcId: vpc.vpcId,
  description: "Security group for Application Load Balancer",
  ingress: [
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [
    { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
  ],
  tags,
});

const ecsSecurityGroup = new aws.ec2.SecurityGroup(`${appName}-${environment}-ecs-sg`, {
  vpcId: vpc.vpcId,
  description: "Security group for ECS tasks",
  ingress: [
    { protocol: "tcp", fromPort: 3000, toPort: 3000, securityGroups: [albSecurityGroup.id] },
  ],
  egress: [
    { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
  ],
  tags,
});

const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${appName}-${environment}-rds-sg`, {
  vpcId: vpc.vpcId,
  description: "Security group for RDS",
  ingress: [
    { protocol: "tcp", fromPort: 3306, toPort: 3306, securityGroups: [ecsSecurityGroup.id] },
  ],
  tags,
});

// =============================================================================
// RDS MySQL Database
// =============================================================================

const dbSubnetGroup = new aws.rds.SubnetGroup(`${appName}-${environment}-db-subnet`, {
  subnetIds: vpc.privateSubnetIds,
  tags,
});

const database = new aws.rds.Instance(`${appName}-${environment}-db`, {
  identifier: `${appName}-${environment}-db`,
  engine: "mysql",
  engineVersion: "8.0",
  instanceClass: environment === "prod" ? "db.t3.medium" : "db.t3.micro",
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageType: "gp3",
  storageEncrypted: true,
  dbName: "hotgigs",
  username: "hotgigs_admin",
  password: dbPassword,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  dbSubnetGroupName: dbSubnetGroup.name,
  multiAz: environment === "prod",
  publiclyAccessible: false,
  skipFinalSnapshot: environment !== "prod",
  deletionProtection: environment === "prod",
  backupRetentionPeriod: environment === "prod" ? 7 : 1,
  backupWindow: "03:00-04:00",
  maintenanceWindow: "Mon:04:00-Mon:05:00",
  performanceInsightsEnabled: environment === "prod",
  tags,
});

// =============================================================================
// S3 Bucket for File Storage
// =============================================================================

const uploadsBucket = new aws.s3.Bucket(`${appName}-${environment}-uploads`, {
  bucket: `${appName}-${environment}-uploads-${Date.now()}`,
  versioning: { enabled: true },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "AES256",
      },
    },
  },
  corsRules: [{
    allowedHeaders: ["*"],
    allowedMethods: ["GET", "PUT", "POST", "DELETE"],
    allowedOrigins: ["*"],
    exposeHeaders: ["ETag"],
    maxAgeSeconds: 3600,
  }],
  tags,
});

new aws.s3.BucketPublicAccessBlock(`${appName}-${environment}-uploads-public-access`, {
  bucket: uploadsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// =============================================================================
// ECR Repository
// =============================================================================

const ecrRepository = new aws.ecr.Repository(`${appName}-${environment}`, {
  name: `${appName}-${environment}`,
  imageScanningConfiguration: { scanOnPush: true },
  imageTagMutability: "MUTABLE",
  tags,
});

new aws.ecr.LifecyclePolicy(`${appName}-${environment}-lifecycle`, {
  repository: ecrRepository.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: "Keep last 10 images",
      selection: {
        tagStatus: "any",
        countType: "imageCountMoreThan",
        countNumber: 10,
      },
      action: { type: "expire" },
    }],
  }),
});

// =============================================================================
// ECS Cluster & Service
// =============================================================================

const cluster = new aws.ecs.Cluster(`${appName}-${environment}-cluster`, {
  name: `${appName}-${environment}-cluster`,
  settings: [{ name: "containerInsights", value: environment === "prod" ? "enabled" : "disabled" }],
  tags,
});

// IAM Roles
const taskExecutionRole = new aws.iam.Role(`${appName}-${environment}-execution-role`, {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ecs-tasks.amazonaws.com" },
    }],
  }),
  tags,
});

new aws.iam.RolePolicyAttachment(`${appName}-${environment}-execution-policy`, {
  role: taskExecutionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

const taskRole = new aws.iam.Role(`${appName}-${environment}-task-role`, {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "ecs-tasks.amazonaws.com" },
    }],
  }),
  tags,
});

new aws.iam.RolePolicy(`${appName}-${environment}-task-s3-policy`, {
  role: taskRole.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["${uploadsBucket.arn}", "${uploadsBucket.arn}/*"]
    }]
  }`,
});

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup(`${appName}-${environment}-logs`, {
  name: `/ecs/${appName}-${environment}`,
  retentionInDays: environment === "prod" ? 30 : 7,
  tags,
});

// Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(`${appName}-${environment}-task`, {
  family: `${appName}-${environment}`,
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: environment === "prod" ? "1024" : "512",
  memory: environment === "prod" ? "2048" : "1024",
  executionRoleArn: taskExecutionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: pulumi.all([database.endpoint, dbPassword, jwtSecret, uploadsBucket.id, logGroup.name]).apply(
    ([dbEndpoint, password, jwt, bucket, logGroupName]) => JSON.stringify([{
      name: appName,
      image: `${ecrRepository.repositoryUrl}:latest`,
      portMappings: [{ containerPort: 3000, hostPort: 3000, protocol: "tcp" }],
      environment: [
        { name: "NODE_ENV", value: "production" },
        { name: "PORT", value: "3000" },
        { name: "DATABASE_URL", value: `mysql://hotgigs_admin:${password}@${dbEndpoint}/hotgigs` },
        { name: "JWT_SECRET", value: jwt },
        { name: "S3_BUCKET", value: bucket },
        { name: "S3_REGION", value: aws.config.region },
      ],
      logConfiguration: {
        logDriver: "awslogs",
        options: {
          "awslogs-group": logGroupName,
          "awslogs-region": aws.config.region,
          "awslogs-stream-prefix": "ecs",
        },
      },
      healthCheck: {
        command: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"],
        interval: 30,
        timeout: 5,
        retries: 3,
        startPeriod: 60,
      },
    }])
  ),
  tags,
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`${appName}-${environment}-alb`, {
  name: `${appName}-${environment}-alb`,
  internal: false,
  loadBalancerType: "application",
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
  enableDeletionProtection: environment === "prod",
  tags,
});

const targetGroup = new aws.lb.TargetGroup(`${appName}-${environment}-tg`, {
  name: `${appName}-${environment}-tg`,
  port: 3000,
  protocol: "HTTP",
  vpcId: vpc.vpcId,
  targetType: "ip",
  healthCheck: {
    enabled: true,
    healthyThreshold: 2,
    interval: 30,
    matcher: "200",
    path: "/api/health",
    port: "traffic-port",
    protocol: "HTTP",
    timeout: 5,
    unhealthyThreshold: 3,
  },
  tags,
});

const httpListener = new aws.lb.Listener(`${appName}-${environment}-http`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: [{
    type: "redirect",
    redirect: {
      port: "443",
      protocol: "HTTPS",
      statusCode: "HTTP_301",
    },
  }],
});

// ECS Service
const service = new aws.ecs.Service(`${appName}-${environment}-service`, {
  name: `${appName}-${environment}-service`,
  cluster: cluster.id,
  taskDefinition: taskDefinition.arn,
  desiredCount: environment === "prod" ? 2 : 1,
  launchType: "FARGATE",
  networkConfiguration: {
    subnets: vpc.privateSubnetIds,
    securityGroups: [ecsSecurityGroup.id],
    assignPublicIp: false,
  },
  loadBalancers: [{
    targetGroupArn: targetGroup.arn,
    containerName: appName,
    containerPort: 3000,
  }],
  deploymentCircuitBreaker: {
    enable: true,
    rollback: true,
  },
  tags,
}, { dependsOn: [httpListener] });

// =============================================================================
// Auto Scaling (Production only)
// =============================================================================

if (environment === "prod") {
  const scalingTarget = new aws.appautoscaling.Target(`${appName}-${environment}-scaling-target`, {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs",
  });

  new aws.appautoscaling.Policy(`${appName}-${environment}-cpu-scaling`, {
    name: `${appName}-${environment}-cpu-scaling`,
    policyType: "TargetTrackingScaling",
    resourceId: scalingTarget.resourceId,
    scalableDimension: scalingTarget.scalableDimension,
    serviceNamespace: scalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: "ECSServiceAverageCPUUtilization",
      },
      targetValue: 70.0,
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
  });
}

// =============================================================================
// Exports
// =============================================================================

export const albDnsName = alb.dnsName;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const rdsEndpoint = database.endpoint;
export const s3BucketName = uploadsBucket.id;
export const vpcId = vpc.vpcId;

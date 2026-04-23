# Cloud Deployment Guide

This guide covers deploying Grounding Designer Pro SaaS to AWS and GCP.

## Prerequisites

- AWS/GCP account with appropriate permissions
- Docker installed locally
- kubectl (for Kubernetes deployments)
- Terraform (optional, for infrastructure as code)

## AWS Deployment

### Option 1: ECS (Elastic Container Service)

#### 1. Push Docker Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name grounding-backend
aws ecr create-repository --repository-name grounding-frontend
aws ecr create-repository --repository-name grounding-worker

# Tag and push images
docker tag grounding-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/grounding-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/grounding-backend:latest
```

#### 2. Create ECS Task Definition

```json
{
  "family": "grounding-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/grounding-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "<rds-endpoint>"
        },
        {
          "name": "REDIS_HOST",
          "value": "<elasticache-endpoint>"
        },
        {
          "name": "JWT_SECRET",
          "value": "<jwt-secret>"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:grounding/db-password"
        }
      ]
    }
  ]
}
```

#### 3. Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier grounding-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id>
```

#### 4. Create ElastiCache Redis

```bash
aws elasticache create-replication-group \
  --replication-group-id grounding-redis \
  --replication-group-description "Redis for Grounding Designer" \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-clusters 2
```

#### 5. Deploy with Terraform

```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "grounding" {
  name = "grounding-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "grounding-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}"
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 3001
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "grounding-backend"
  cluster         = aws_ecs_cluster.grounding.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"
}
```

### Option 2: EKS (Elastic Kubernetes Service)

#### 1. Create EKS Cluster

```bash
aws eks create-cluster \
  --name grounding-cluster \
  --region us-east-1 \
  --kubernetes-version 1.28 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4
```

#### 2. Deploy Kubernetes Manifests

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grounding-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: grounding-backend
  template:
    metadata:
      labels:
        app: grounding-backend
    spec:
      containers:
      - name: backend
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/grounding-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: grounding-secrets
              key: db-host
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: grounding-secrets
              key: jwt-secret
```

```yaml
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: grounding-backend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: grounding-backend
```

#### 3. Deploy

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
```

## GCP Deployment

### Option 1: Cloud Run

#### 1. Build and Push to GCR

```bash
# Build image
gcloud builds submit --tag gcr.io/<project-id>/grounding-backend

# Deploy to Cloud Run
gcloud run deploy grounding-backend \
  --image gcr.io/<project-id>/grounding-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=DB_HOST=<cloud-sql-ip>,REDIS_HOST=<memorystore-ip>
```

#### 2. Create Cloud SQL PostgreSQL

```bash
gcloud sql instances create grounding-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-version=POSTGRES_14

gcloud sql databases create grounding_saas \
  --instance=grounding-db
```

#### 3. Create Memorystore Redis

```bash
gcloud redis instances create grounding-redis \
  --tier=STANDARD_HA \
  --region=us-central1 \
  --memory-size-gb=1
```

### Option 2: GKE (Google Kubernetes Engine)

#### 1. Create GKE Cluster

```bash
gcloud container clusters create grounding-cluster \
  --region=us-central1 \
  --num-nodes=2 \
  --machine-type=e2-medium
```

#### 2. Deploy Kubernetes Manifests

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grounding-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: grounding-backend
  template:
    metadata:
      labels:
        app: grounding-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/<project-id>/grounding-backend:latest
        ports:
        - containerPort: 3001
```

#### 3. Deploy

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
```

## Environment Variables

### Required for All Deployments

```bash
# Database
DB_HOST=<database-host>
DB_PORT=5432
DB_NAME=grounding_saas
DB_USER=postgres
DB_PASSWORD=<secure-password>

# Redis
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<optional>

# JWT
JWT_SECRET=<secure-random-string>

# Storage (S3/GCS)
S3_BUCKET=<bucket-name>
S3_REGION=<region>
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>

# Frontend
FRONTEND_URL=<frontend-url>
REACT_APP_API_URL=<backend-api-url>
```

## SSL/TLS Configuration

### AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name grounding.example.com \
  --validation-method DNS

# Validate with DNS records
aws acm describe-certificate \
  --certificate-arn <cert-arn>
```

### GCP Certificate Manager

```bash
gcloud certificate-manager certificates create grounding-cert \
  --domains=grounding.example.com \
  --dns-authority=lets-encrypt
```

## Monitoring & Logging

### AWS CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /grounding/backend

# Create metric filters
aws logs put-metric-filter \
  --log-group-name /grounding/backend \
  --filter-name ErrorCount \
  --filter-pattern "[ERROR]"
```

### GCP Cloud Logging

```bash
# Export logs to BigQuery
gcloud logging sinks create grounding-sink \
  bigquery.googleapis.com/projects/<project-id>/datasets/grounding_logs
```

## Scaling Configuration

### Auto Scaling (AWS)

```json
{
  "minCapacity": 1,
  "maxCapacity": 10,
  "targetCapacity": 2,
  "scaleInCooldown": 300,
  "scaleOutCooldown": 60,
  "policies": [
    {
      "policyName": "cpu-scale",
      "policyType": "TargetTrackingScaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 70.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ASGAverageCPUUtilization"
        }
      }
    }
  ]
}
```

### Auto Scaling (GCP)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: grounding-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grounding-backend
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## CI/CD Pipeline

### GitHub Actions (AWS)

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: grounding-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

### GitHub Actions (GCP)

```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Authenticate to GCP
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_CREDENTIALS }}
    
    - name: Build and push
      run: |
        gcloud builds submit --tag gcr.io/$PROJECT_ID/grounding-backend:$GITHUB_SHA ./backend
```

## Cost Optimization

### AWS Cost Saving Tips

- Use Spot Instances for workers
- Enable auto-scaling
- Use Reserved Instances for baseline load
- Use S3 Intelligent Tiering for storage
- Enable CloudWatch Logs retention policies

### GCP Cost Saving Tips

- Use Preemptible VMs for workers
- Enable auto-scaling
- Use Committed Use Discounts
- Use Cloud Storage Nearline for old data
- Enable Cloud Logging export to reduce costs

## Security Best Practices

1. **Secrets Management**
   - Use AWS Secrets Manager or GCP Secret Manager
   - Rotate secrets regularly
   - Never commit secrets to git

2. **Network Security**
   - Use VPC with private subnets
   - Configure security groups/firewall rules
   - Enable VPC peering only when necessary

3. **IAM Permissions**
   - Follow principle of least privilege
   - Use IAM roles for services
   - Regular audit of permissions

4. **Data Encryption**
   - Enable encryption at rest (EBS, RDS, S3)
   - Enable encryption in transit (TLS)
   - Use KMS for key management

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Check security group allows traffic
- Verify database is in same VPC
- Check credentials in secrets

**Redis Connection Failed**
- Verify Redis instance is running
- Check network connectivity
- Verify password if configured

**Worker Not Processing Jobs**
- Check BullMQ queue status
- Verify Redis connection
- Check worker logs for errors

## Support

For deployment issues:
- AWS: https://aws.amazon.com/support/
- GCP: https://cloud.google.com/support

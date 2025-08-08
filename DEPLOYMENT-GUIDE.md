# 🚀 AWS Photo Share - Infrastructure as Code Deployment Guide

## ✅ Infrastructure Successfully Created!

Your AWS Photo Share application infrastructure has been successfully converted to **Infrastructure as Code (IaC)** using **AWS CDK with TypeScript**. The problematic batch files have been eliminated and replaced with proper CDK deployment.

## 📋 What's Included

### 🏗️ Complete Infrastructure Stack

- **Cognito User Pool**: User authentication and registration
- **DynamoDB Table**: Photo metadata storage with Global Secondary Index
- **S3 Buckets**: Separate buckets for photos and thumbnails
- **CloudFront Distribution**: Global CDN for photo delivery
- **Lambda Functions**:
  - Photo API (CRUD operations)
  - Thumbnail Generator (automatic processing)
- **API Gateway**: RESTful API with Cognito authorization
- **IAM Roles & Policies**: Secure permissions

### 🔧 TypeScript Implementation

- **Modern CDK**: Latest version with TypeScript
- **Docker Integration**: Automated Lambda bundling
- **Fixed Deprecations**: Updated CloudFront S3Origin to S3BucketOrigin
- **Multi-Environment**: Support for dev/prod environments

## 🚀 One-Command Deployment

### Prerequisites

```bash
# 1. Install AWS CLI and configure credentials
aws configure --profile photoapp-dev

# 2. Install dependencies
cd backend/infra
npm install
```

### 🎯 Deploy to Development (One Command!)

```bash
npm run deploy:dev
```

### 🎯 Deploy to Production

```bash
npm run deploy:prod
```

## 📝 Available Commands

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run build`        | Compile TypeScript                |
| `npm run synth`        | Generate CloudFormation template  |
| `npm run bootstrap`    | Bootstrap CDK (first time only)   |
| `npm run deploy:dev`   | Deploy to development environment |
| `npm run deploy:prod`  | Deploy to production environment  |
| `npm run destroy:dev`  | Remove development stack          |
| `npm run destroy:prod` | Remove production stack           |
| `npm run diff:dev`     | Show changes before deploying     |

## 🔍 Stack Outputs

After successful deployment, you'll receive these important values:

```
Outputs:
PhotoShareStack-dev.UserPoolId = us-east-1_xxxxxxxxx
PhotoShareStack-dev.UserPoolClientId = xxxxxxxxxxxxxxxxxx
PhotoShareStack-dev.ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
PhotoShareStack-dev.PhotosBucketName = photos-dev-971422701143
PhotoShareStack-dev.ThumbnailsBucketName = thumbnails-dev-971422701143
PhotoShareStack-dev.PhotosDistributionUrl = https://xxxxxxxxxxxxxx.cloudfront.net
```

## ⚙️ Environment Configuration

The infrastructure supports multiple environments:

### Development Environment

- Stack Name: `PhotoShareStack-dev`
- Resources prefixed with `-dev`
- Development CORS settings
- Basic monitoring

### Production Environment

- Stack Name: `PhotoShareStack-prod`
- Resources prefixed with `-prod`
- Production security settings
- Enhanced monitoring

## 🔗 Frontend Integration

Use these deployment outputs to configure your frontend:

```bash
# Copy frontend environment template
cd ../../frontend
cp .env.template .env

# Edit .env with the deployment outputs
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_PHOTOS_BUCKET=photos-dev-971422701143
VITE_CLOUDFRONT_URL=https://xxxxxxxxxxxxxx.cloudfront.net
```

## 🛠️ Troubleshooting

### Docker Issues

If you encounter Docker-related errors:

```bash
# Ensure Docker Desktop is running
docker --version
docker ps

# Add Docker to PATH if needed (Windows)
export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"
```

### CDK Bootstrap

If this is your first time using CDK in this AWS account/region:

```bash
npm run bootstrap
```

### Permission Issues

Ensure your AWS profile has sufficient permissions:

- CloudFormation
- IAM roles and policies
- Lambda functions
- S3 buckets
- API Gateway
- Cognito User Pools
- DynamoDB tables

## 🎉 Success!

You now have a **proper Infrastructure as Code solution** that:

- ✅ Eliminates problematic batch/shell scripts
- ✅ Uses modern AWS CDK with TypeScript
- ✅ Supports multiple environments
- ✅ Provides one-command deployment
- ✅ Includes proper dependency management
- ✅ Generates secure IAM policies automatically
- ✅ Supports Docker-based Lambda bundling

**No more script failures - just reliable, repeatable infrastructure deployments!** 🚀

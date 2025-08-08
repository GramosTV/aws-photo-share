# Deployment Runbook

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- Chosen IaC tool installed (SAM CLI, CDK, etc.)

## Deployment Steps

### 1. Backend Infrastructure Deployment

#### Using AWS SAM

```bash
cd backend/infra
sam build
sam deploy --guided --profile photoapp-dev
```

#### Using AWS CDK

```bash
cd backend/infra
npm install
cdk deploy --profile photoapp-dev
```

### 2. Frontend Deployment

#### Environment Configuration

1. Copy environment variables from backend deployment output
2. Update `frontend/.env` file:

```bash
VITE_AWS_REGION=eu-central-1
VITE_COGNITO_USER_POOL_ID=<from-deployment-output>
VITE_COGNITO_USER_POOL_CLIENT_ID=<from-deployment-output>
VITE_API_GATEWAY_URL=<from-deployment-output>
VITE_S3_BUCKET_NAME=<from-deployment-output>
VITE_CLOUDFRONT_URL=<from-deployment-output>
```

#### Build and Deploy

```bash
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://your-frontend-bucket --profile photoapp-dev
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*" --profile photoapp-dev
```

### 3. Verification Steps

1. Access the CloudFront URL
2. Register a new user account
3. Upload a test photo
4. Verify thumbnail generation
5. Test photo sharing functionality

## Environment-Specific Deployments

### Development

- Use `photoapp-dev` AWS profile
- Deploy to `eu-central-1` region
- Enable debug logging

### Production

- Use `photoapp-prod` AWS profile
- Deploy to `eu-central-1` region
- Enable production optimizations
- Configure monitoring and alerts

## Rollback Procedures

1. Revert to previous CloudFormation stack version
2. Redeploy previous frontend version
3. Update DNS if necessary
4. Verify rollback success

## Post-Deployment Checklist

- [ ] Verify all API endpoints are working
- [ ] Test user registration and login
- [ ] Confirm photo upload functionality
- [ ] Check thumbnail generation
- [ ] Validate CloudFront caching
- [ ] Review CloudWatch logs for errors
- [ ] Test mobile responsiveness

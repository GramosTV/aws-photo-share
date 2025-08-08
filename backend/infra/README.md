# AWS Photo Share Infrastructure

## Infrastructure as Code with AWS CDK

This directory contains the AWS CDK infrastructure code for the Photo Share application.

### Prerequisites

1. Install AWS CLI and configure your credentials
2. Install Node.js 18+ and npm
3. Install AWS CDK globally: `npm install -g aws-cdk`

### Deployment Commands

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the TypeScript**:

   ```bash
   npm run build
   ```

3. **Bootstrap CDK (first time only)**:

   ```bash
   npm run bootstrap
   ```

4. **Deploy to development environment**:

   ```bash
   npm run deploy:dev
   ```

5. **Deploy to production environment**:

   ```bash
   npm run deploy:prod
   ```

6. **Destroy the stack**:
   ```bash
   npm run destroy:dev
   # or
   npm run destroy:prod
   ```

### Environment Configuration

The stack supports multiple environments (dev, prod) with different configurations:

- Development: `cdk deploy PhotoShareStack-dev`
- Production: `cdk deploy PhotoShareStack-prod`

### Infrastructure Components

- **Cognito User Pool**: Authentication and user management
- **DynamoDB Table**: Photo metadata storage
- **S3 Buckets**: Photo storage and thumbnails
- **CloudFront**: Global content delivery
- **Lambda Functions**: API handlers and thumbnail generation
- **API Gateway**: RESTful API endpoints

### Output Values

After deployment, the stack outputs important values like:

- User Pool ID and Client ID
- API Gateway URL
- S3 bucket names
- CloudFront distribution URL

These values should be used to configure the frontend application.

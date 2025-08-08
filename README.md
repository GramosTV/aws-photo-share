# AWS Photo Share Application

A modern, serverless photo sharing application built with AWS services, featuring automatic image processing, intelligent tagging, and optimized content delivery.

## 🏗️ Architecture Overview

This application implements a complete serverless photo sharing platform using AWS services. The architecture is designed for scalability, security, and cost-effectiveness with automatic image processing and content delivery optimization.

### Key Features

- **Secure Authentication**: AWS Cognito User Pool and Identity Pool
- **File Upload**: Direct-to-S3 uploads with pre-signed URLs
- **Image Processing**: Automatic resizing, compression, and optimization
- **AI-Powered Tagging**: Amazon Rekognition for automatic content tagging
- **Global Content Delivery**: CloudFront CDN for low-latency access
- **Search & Filter**: Search photos by title and filter by AI-generated tags
- **Responsive Frontend**: Vue 3 with TypeScript and Tailwind CSS

### AWS Services Used

| Service                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **AWS CDK**            | Infrastructure as Code deployment                           |
| **Amazon S3**          | Object storage for photos, thumbnails, and processed images |
| **AWS Lambda**         | Serverless compute for API and image processing             |
| **Amazon DynamoDB**    | NoSQL database for photo metadata                           |
| **Amazon API Gateway** | RESTful API endpoints                                       |
| **AWS Cognito**        | User authentication and authorization                       |
| **Amazon CloudFront**  | Global content delivery network                             |
| **Amazon Rekognition** | AI-powered image analysis and tagging                       |
| **AWS IAM**            | Identity and access management                              |

## 🏛️ High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   (Vue 3)       │◄──►│   (REST API)     │◄──►│   (Photo API)   │
│   CloudFront    │    │   + CORS         │    │   + Auth        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        ▼
         │                        │              ┌─────────────────┐
         │                        │              │   DynamoDB      │
         │                        │              │   (Metadata)    │
         │                        │              └─────────────────┘
         │                        │
         ▼                        │
┌─────────────────┐               │              ┌─────────────────┐
│   S3 Buckets    │               │              │   Cognito       │
│   - Photos      │               └─────────────►│   - User Pool   │
│   - Thumbnails  │                              │   - Identity    │
│   - Processed   │                              └─────────────────┘
│   - Frontend    │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   S3 Events     │───►│   Lambda         │───►│   Rekognition   │
│   (Triggers)    │    │   (Processor)    │    │   (AI Tagging)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 Data Flow Diagram

### Photo Upload Flow

```
User → Frontend → Cognito Auth → API Gateway → Lambda → S3 Pre-signed URL
                                     │
                                     ▼
                              DynamoDB Metadata
                                     │
                                     ▼
                              S3 Upload Complete
                                     │
                                     ▼
                              S3 Event Trigger
                                     │
                                     ▼
                              Image Processor Lambda
                                     │
                           ┌─────────┼─────────┐
                           ▼         ▼         ▼
                    Thumbnail   Processed   Rekognition
                    Creation    Resize      Tagging
                           │         │         │
                           └─────────┼─────────┘
                                     ▼
                              Update DynamoDB
                                     │
                                     ▼
                              Processing Complete
```

### Photo Display Flow

```
User → Frontend → API Gateway → Lambda → DynamoDB Query
          │                                    │
          │                                    ▼
          │                            Photo Metadata
          │                                    │
          │                                    ▼
          │                            Generate URLs
          │                                    │
          └──────► CloudFront CDN ◄───────────┘
                       │
                       ▼
                  Optimized Images
                  (Processed/Thumbnails)
```

## 📁 Project Structure

```
aws-photo-share/
├── backend/
│   ├── infra/                    # AWS CDK Infrastructure
│   │   ├── lib/
│   │   │   └── photo-share-stack.ts
│   │   ├── bin/
│   │   │   └── photo-share.ts
│   │   └── package.json
│   └── lambdas/
│       ├── photo-api/            # Main API Lambda
│       │   ├── src/
│       │   │   ├── index.ts
│       │   │   └── types.ts
│       │   └── package.json
│       └── image-processor/      # Image Processing Lambda
│           ├── src/
│           │   └── index.ts
│           └── package.json
├── frontend/                     # Vue 3 Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── types/
│   │   └── App.vue
│   ├── public/
│   └── package.json
└── infrastructure/               # Alternative IaC Templates
    └── cloudformation/
        └── photo-share-template.yaml
```

## 🚀 Deployment Guide

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js** 18+ and npm
4. **Git** for cloning the repository

### Step-by-Step Deployment

#### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/GramosTV/aws-photo-share.git
cd aws-photo-share

# Install dependencies for infrastructure
cd backend/infra
npm install

# Install dependencies for Lambda functions
cd ../lambdas/photo-api
npm install

cd ../image-processor
npm install

# Install dependencies for frontend
cd ../../../frontend
npm install
```

#### 2. Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd ../backend/infra

# Deploy with CDK (recommended)
npm run deploy

# Alternative: Use specific environment
npx cdk deploy --context environment=prod
```

#### 3. Build and Deploy Lambda Functions

The CDK deployment automatically builds and deploys the Lambda functions. If you need to update them separately:

```bash
# Build photo API
cd ../lambdas/photo-api
npm run build

# Build image processor
cd ../image-processor
npm run build

# Redeploy infrastructure to update functions
cd ../../infra
npm run deploy
```

#### 4. Build and Deploy Frontend

```bash
# Build frontend
cd ../../../frontend
npm run build

# Deploy to S3 (replace bucket name with your actual bucket)
aws s3 sync dist/ s3://frontend-dev-YOUR-ACCOUNT-ID --delete

# Invalidate CloudFront cache for immediate updates
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

#### 5. Get Deployment Outputs

After deployment, note the following outputs from CDK:

- **Frontend URL**: CloudFront distribution for the web app
- **API URL**: API Gateway endpoint
- **User Pool ID**: For Cognito configuration
- **Identity Pool ID**: For AWS SDK configuration

### Configuration

#### Frontend Configuration

1. **Copy the environment template**:

```bash
cd frontend
cp .env.template .env
```

2. **Update the `.env` file** with your deployment outputs:

```bash
# AWS Region
VITE_AWS_REGION=eu-central-1

# Cognito Configuration (from CDK outputs)
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_IDENTITY_POOL_ID=your-identity-pool-id

# API Gateway URL (from CDK outputs)
VITE_API_URL=your-api-gateway-url

# S3 Bucket Names (from CDK outputs)
VITE_PHOTOS_BUCKET=your-photos-bucket-name

# Application Configuration
VITE_APP_NAME="Photo Share App"
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

The frontend uses Vite environment variables that are automatically loaded and configured in `src/main.ts`.

## 🔧 Development Workflow

### Local Development

1. **Backend Development**: Use AWS SAM or CDK for local testing
2. **Frontend Development**: Standard Vue development server
3. **Testing**: Unit tests for Lambda functions and frontend components

### CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy Photo Share App
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install and Deploy
        run: |
          cd backend/infra
          npm install
          npm run deploy
```

## 🔒 Security Considerations

- **Authentication**: Cognito provides secure user management
- **Authorization**: IAM roles with least privilege access
- **Data Encryption**: S3 bucket encryption enabled
- **API Security**: CORS configured, Cognito authorizers
- **Content Delivery**: CloudFront with origin access control

## 💰 Cost Optimization

- **Serverless Architecture**: Pay only for what you use
- **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
- **CloudFront Caching**: Reduces S3 requests and improves performance
- **DynamoDB On-Demand**: Scales automatically without over-provisioning

## 🔍 Monitoring & Troubleshooting

### CloudWatch Logs

- Lambda function logs for debugging
- API Gateway access logs
- CloudFront access logs

### Common Issues

1. **CORS Errors**: Check API Gateway CORS configuration
2. **Authentication Issues**: Verify Cognito User Pool settings
3. **Image Processing Failures**: Check Lambda timeout and memory settings
4. **Slow Loading**: Verify CloudFront distribution status

## 🎯 Features by Phase

- **Phase 1**: ✅ Infrastructure as Code (AWS CDK)
- **Phase 2**: ✅ Frontend Hosting & Authentication
- **Phase 3**: ✅ Backend & File Upload Flow
- **Phase 4**: ✅ Image Processing Pipeline
- **Phase 5**: ✅ Display & Retrieval with Search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using AWS Serverless Technologies**

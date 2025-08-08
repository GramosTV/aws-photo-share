# Architecture Overview

## System Architecture

The AWS Serverless Photo Sharing App follows a modern serverless architecture pattern designed for scalability, security, and cost-effectiveness.

## Architecture Diagram

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Users     │    │  CloudFront  │    │     S3      │
│             ├────┤   (CDN)      ├────┤  (Frontend) │
│             │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
        │
        │ Authentication
        ▼
┌─────────────┐
│   Cognito   │
│ User Pool   │
└─────────────┘
        │
        │ Authenticated Requests
        ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ API Gateway │    │    Lambda    │    │  DynamoDB   │
│             ├────┤  Functions   ├────┤ (Metadata)  │
│             │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           │ Photo Storage
                           ▼
                   ┌──────────────┐    ┌─────────────┐
                   │      S3      │    │   Lambda    │
                   │   (Photos)   ├────┤(Thumbnail)  │
                   │              │    │             │
                   └──────────────┘    └─────────────┘
```

## Components

### Frontend Layer

- **Vue.js Application**: Single-page application (SPA) for user interface
- **Amazon S3**: Hosts static frontend assets
- **CloudFront**: Global CDN for fast content delivery

### Authentication Layer

- **Amazon Cognito**: User registration, authentication, and authorization
- **JWT Tokens**: Secure API access

### API Layer

- **API Gateway**: RESTful API endpoints with Cognito authorization
- **Lambda Functions**: Serverless compute for business logic

### Data Layer

- **DynamoDB**: NoSQL database for photo metadata
- **S3 Buckets**: Object storage for original photos and thumbnails

### Processing Layer

- **Lambda Functions**: Event-driven image processing
- **S3 Events**: Trigger thumbnail generation

## Data Flow

### Photo Upload Flow

1. User authenticates via Cognito
2. Frontend requests pre-signed S3 URL from API
3. Photo is uploaded directly to S3
4. S3 event triggers thumbnail generation Lambda
5. Photo metadata is stored in DynamoDB
6. Frontend updates with new photo

### Photo Viewing Flow

1. Frontend requests photo list from API
2. Lambda queries DynamoDB for metadata
3. Pre-signed URLs generated for S3 objects
4. Photos displayed via CloudFront CDN

## Security Architecture

### Authentication & Authorization

- Cognito User Pools for user management
- JWT tokens for API authentication
- IAM roles for service-to-service authorization

### Data Security

- S3 bucket policies restrict direct access
- Pre-signed URLs for temporary access
- HTTPS/TLS encryption in transit
- S3 encryption at rest

### Network Security

- API Gateway CORS configuration
- CloudFront security headers
- VPC endpoints (if required)

## Scalability Features

- Serverless auto-scaling
- DynamoDB on-demand scaling
- CloudFront global edge locations
- S3 infinite storage capacity

## Cost Optimization

- Pay-per-use serverless model
- S3 Intelligent Tiering
- CloudFront caching reduces origin requests
- DynamoDB on-demand pricing

## Monitoring & Observability

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway
- X-Ray tracing for distributed requests
- Custom dashboards for operational metrics

# Backend - AWS Infrastructure and Lambda Functions

## Description

Backend infrastructure and serverless functions for the photo sharing application.

## Structure

- `infra/` - Infrastructure as Code templates
- `lambdas/` - Lambda function source code

## Infrastructure Components

- **Cognito User Pool** - User authentication and management
- **S3 Buckets** - Original photos and thumbnails storage
- **CloudFront** - CDN for global content delivery
- **API Gateway** - REST API endpoints
- **Lambda Functions** - Serverless compute for API and image processing
- **DynamoDB** - Photo metadata storage
- **IAM Roles** - Service permissions

## Lambda Functions

1. **Photo API** - CRUD operations for photos
2. **Thumbnail Generator** - S3 event-triggered image resizing
3. **User Management** - Cognito user operations

## Deployment

See `infra/README.md` for infrastructure deployment instructions.

## API Endpoints

- `GET /photos` - List user's photos
- `POST /photos` - Upload photo metadata
- `GET /photos/{id}` - Get photo details
- `DELETE /photos/{id}` - Delete photo
- `POST /photos/{id}/share` - Share photo with other users

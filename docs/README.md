# Documentation

## Description

This directory contains documentation for the AWS Serverless Photo Sharing application.

## Contents

- `architecture.md` - System architecture overview
- `runbooks/` - Operational runbooks and troubleshooting guides

## Getting Started

1. Read the architecture overview to understand the system design
2. Check the runbooks for operational procedures
3. Refer to the main README.md for quick start instructions

## Architecture Overview

The application follows a serverless architecture pattern with:

- Static frontend hosted on S3/CloudFront
- API Gateway for REST endpoints
- Lambda functions for business logic
- DynamoDB for data persistence
- Cognito for authentication
- S3 for file storage

## Security Considerations

- All API endpoints require Cognito authentication
- S3 buckets use pre-signed URLs for secure uploads
- CORS is properly configured for frontend access
- IAM roles follow the principle of least privilege

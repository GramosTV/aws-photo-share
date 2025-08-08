# Frontend - Vue Photo Sharing App

## Description

Vue.js frontend for the AWS Serverless Photo Sharing application.

## Technology Stack

- Vue 3
- Vite (build tool)
- Vue Router (routing)
- Pinia (state management)
- AWS Amplify SDK (for AWS service integration)
- TailwindCSS (styling)

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

- User authentication (Cognito)
- Photo upload to S3
- Photo gallery with thumbnails
- Photo sharing and permissions
- Responsive design

## Environment Configuration

Create a `.env` file with the following variables:

```
VITE_AWS_REGION=eu-central-1
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_USER_POOL_CLIENT_ID=
VITE_API_GATEWAY_URL=
VITE_S3_BUCKET_NAME=
VITE_CLOUDFRONT_URL=
```

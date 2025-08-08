# Infrastructure as Code

## Description

This directory contains Infrastructure as Code (IaC) templates for deploying the AWS Serverless Photo Sharing application.

## Supported IaC Tools

Choose one of the following deployment methods:

### 1. AWS SAM (Recommended)

- `template.yaml` - SAM template
- `samconfig.toml` - SAM configuration

### 2. AWS CDK

- `app.py` or `app.js` - CDK application
- `cdk.json` - CDK configuration

### 3. Serverless Framework

- `serverless.yml` - Serverless configuration

### 4. CloudFormation

- `cloudformation.yaml` - Raw CloudFormation template

## Deployment Instructions

### Using AWS SAM

1. Install SAM CLI
2. Configure AWS CLI profile: `aws configure --profile photoapp-dev`
3. Deploy:
   ```bash
   sam build
   sam deploy --guided --profile photoapp-dev
   ```

### Using AWS CDK

1. Install CDK: `npm install -g aws-cdk`
2. Configure AWS CLI profile: `aws configure --profile photoapp-dev`
3. Deploy:
   ```bash
   cdk deploy --profile photoapp-dev
   ```

## Environment Variables

The following environment variables will be output after deployment:

- Cognito User Pool ID
- Cognito User Pool Client ID
- API Gateway URL
- S3 Bucket Names
- CloudFront Distribution URL

## Region Configuration

Default region: `eu-central-1`
To change the region, update the configuration in your chosen IaC tool.

# AWS Serverless Photo Sharing App — Vue Edition

## Goal

Build a globally available, secure, and serverless photo-sharing app using:

- Vue (frontend)
- Amazon S3 + CloudFront (static delivery)
- Cognito (authentication)
- API Gateway + Lambda (backend)
- DynamoDB (metadata)
- S3 events + Lambda (thumbnailing)

## Structure

- frontend/ — Vue app
- backend/ — Lambdas + IaC
- docs/ — architecture & runbooks

## Quick start (development)

1. Configure AWS CLI profile `photoapp-dev`.
2. `cd frontend && npm install && npm run dev`
3. Deploy infra using chosen IaC (see backend/infra/README.md)

## AWS Services used

Cognito, S3, CloudFront, API Gateway, Lambda, DynamoDB, CloudWatch, IAM.

## Regions

Primary region: eu-central-1 (change in infra configs if needed)

## Project Structure

```
├─ frontend/                 # Vue app (Vite or Vue CLI)
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  └─ README.md
├─ backend/                  # IaC + Lambda code + API definitions
│  ├─ infra/                 # CloudFormation / CDK / SAM / Serverless Framework
│  ├─ lambdas/               # lambda handlers (nodejs/python)
│  └─ README.md
├─ docs/
│  ├─ architecture.md
│  ├─ runbooks/
│  └─ README.md
├─ .gitignore
└─ README.md
```

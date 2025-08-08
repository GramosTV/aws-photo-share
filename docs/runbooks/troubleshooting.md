# Troubleshooting Guide

## Common Issues and Solutions

### Frontend Issues

#### Application Not Loading

**Symptoms**: Blank page or loading spinner that never resolves

**Possible Causes**:

- CloudFront distribution not properly configured
- S3 bucket permissions issues
- Incorrect environment variables

**Solutions**:

1. Check CloudFront distribution status
2. Verify S3 bucket policy allows CloudFront access
3. Validate environment variables in frontend build
4. Check browser console for errors

#### Authentication Errors

**Symptoms**: Login fails or redirects to error page

**Possible Causes**:

- Cognito User Pool misconfiguration
- Incorrect client ID or user pool ID
- CORS issues with API Gateway

**Solutions**:

1. Verify Cognito User Pool settings
2. Check environment variables match AWS resources
3. Validate CORS configuration in API Gateway
4. Test with a known good user account

### Backend Issues

#### API Gateway 403 Errors

**Symptoms**: API calls return 403 Forbidden

**Possible Causes**:

- Missing or invalid JWT token
- Cognito authorizer misconfiguration
- IAM role permissions issues

**Solutions**:

1. Verify JWT token is being sent in Authorization header
2. Check Cognito User Pool Authorizer configuration
3. Review Lambda execution role permissions
4. Test API calls with valid Cognito tokens

#### Lambda Function Timeouts

**Symptoms**: 504 Gateway Timeout errors

**Possible Causes**:

- Inefficient database queries
- Large image processing operations
- Cold start delays

**Solutions**:

1. Optimize DynamoDB queries with proper indexes
2. Implement image processing limits and async processing
3. Increase Lambda timeout settings
4. Consider provisioned concurrency for critical functions

#### Photo Upload Failures

**Symptoms**: Photos fail to upload or process

**Possible Causes**:

- S3 bucket permissions
- Pre-signed URL issues
- Image size limitations
- Thumbnail generation failures

**Solutions**:

1. Verify S3 bucket CORS configuration
2. Check pre-signed URL generation logic
3. Implement file size validation
4. Review thumbnail Lambda function logs

### Infrastructure Issues

#### DynamoDB Throttling

**Symptoms**: 400 errors with ProvisionedThroughputExceededException

**Solutions**:

1. Switch to On-Demand billing mode
2. Increase provisioned capacity
3. Implement exponential backoff in application code
4. Review access patterns and optimize queries

#### S3 Access Issues

**Symptoms**: 403 errors when accessing S3 objects

**Solutions**:

1. Review S3 bucket policies
2. Check IAM role permissions
3. Verify object ownership
4. Test with AWS CLI to isolate issues

## Monitoring and Alerting

### Key Metrics to Monitor

- API Gateway 4xx/5xx error rates
- Lambda function duration and error rates
- DynamoDB throttling events
- S3 request rates and errors
- CloudFront cache hit ratio

### Setting Up Alerts

1. CloudWatch Alarms for error rates
2. SNS notifications for critical failures
3. Custom dashboards for operational metrics
4. Log aggregation and analysis

## Performance Optimization

### Frontend Performance

- Implement lazy loading for images
- Use progressive image formats (WebP)
- Optimize bundle size with code splitting
- Leverage CloudFront caching

### Backend Performance

- Optimize DynamoDB access patterns
- Implement caching strategies
- Use S3 Transfer Acceleration
- Tune Lambda memory allocation

## Security Considerations

- Regularly rotate AWS credentials
- Review IAM policies for least privilege
- Monitor for suspicious access patterns
- Keep dependencies updated for security patches

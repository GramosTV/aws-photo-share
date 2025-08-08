import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as path from 'path';

export interface PhotoShareStackProps extends cdk.StackProps {
  environment: string;
  stackName: string;
}

export class PhotoShareStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PhotoShareStackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'PhotoUserPool', {
      userPoolName: `photo-users-${props.environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environments
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'PhotoUserPoolClient', {
      userPool,
      userPoolClientName: `photo-client-${props.environment}`,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
    });

    // DynamoDB Tables
    const photosTable = new dynamodb.Table(this, 'PhotosTable', {
      tableName: `photos-${props.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    photosTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // S3 Buckets
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `photos-${props.environment}-${cdk.Aws.ACCOUNT_ID}`,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const thumbnailsBucket = new s3.Bucket(this, 'ThumbnailsBucket', {
      bucketName: `thumbnails-${props.environment}-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Frontend hosting bucket
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `frontend-${props.environment}-${cdk.Aws.ACCOUNT_ID}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
        },
      ],
    });

    // Cognito Identity Pool for S3 access
    const identityPool = new cognito.CfnIdentityPool(this, 'PhotoIdentityPool', {
      identityPoolName: `photo-identity-${props.environment}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // IAM roles for authenticated users
    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        S3Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
              resources: [`${photosBucket.bucketArn}/photos/\${cognito-identity.amazonaws.com:sub}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [photosBucket.bucketArn],
              conditions: {
                StringLike: {
                  's3:prefix': ['photos/${cognito-identity.amazonaws.com:sub}/*'],
                },
              },
            }),
          ],
        }),
      },
    });

    // Attach roles to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // CloudFront Distribution for photos
    const photosDistribution = new cloudfront.Distribution(this, 'PhotosDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(photosBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // CloudFront Distribution for frontend
    const frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // For SPA routing
          ttl: cdk.Duration.minutes(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // For SPA routing
          ttl: cdk.Duration.minutes(0),
        },
      ],
    });

    // Lambda Functions
    const photoApiFunction = new lambda.Function(this, 'PhotoApiFunction', {
      functionName: `photo-api-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/photo-api'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: ['bash', '-c', 'npm install && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
      environment: {
        PHOTOS_TABLE_NAME: photosTable.tableName,
        PHOTOS_BUCKET_NAME: photosBucket.bucketName,
        THUMBNAILS_BUCKET_NAME: thumbnailsBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const thumbnailFunction = new lambda.Function(this, 'ThumbnailFunction', {
      functionName: `thumbnail-generator-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/thumbnail'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: ['bash', '-c', 'npm install && npm run build && cp -r dist/* /asset-output/'],
        },
      }),
      environment: {
        THUMBNAILS_BUCKET_NAME: thumbnailsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
    });

    // IAM Permissions
    photosTable.grantReadWriteData(photoApiFunction);
    photosBucket.grantReadWrite(photoApiFunction);
    thumbnailsBucket.grantReadWrite(photoApiFunction);
    thumbnailsBucket.grantReadWrite(thumbnailFunction);
    photosBucket.grantRead(thumbnailFunction);

    // S3 Event Notification
    photosBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(thumbnailFunction)
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'PhotoShareApi', {
      restApiName: `photo-share-api-${props.environment}`,
      description: 'Photo sharing application API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'PhotoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Routes
    const photosResource = api.root.addResource('photos');

    photosResource.addMethod('GET', new apigateway.LambdaIntegration(photoApiFunction), {
      authorizer,
    });

    photosResource.addMethod('POST', new apigateway.LambdaIntegration(photoApiFunction), {
      authorizer,
    });

    const photoResource = photosResource.addResource('{id}');
    photoResource.addMethod('GET', new apigateway.LambdaIntegration(photoApiFunction));
    photoResource.addMethod('PUT', new apigateway.LambdaIntegration(photoApiFunction), {
      authorizer,
    });
    photoResource.addMethod('DELETE', new apigateway.LambdaIntegration(photoApiFunction), {
      authorizer,
    });

    // Upload endpoint
    const uploadResource = api.root.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(photoApiFunction), {
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: photosBucket.bucketName,
      description: 'Photos S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'ThumbnailsBucketName', {
      value: thumbnailsBucket.bucketName,
      description: 'Thumbnails S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'PhotosDistributionUrl', {
      value: `https://${photosDistribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL for Photos',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontendDistribution.distributionDomainName}`,
      description: 'Frontend CloudFront Distribution URL',
    });
  }
}

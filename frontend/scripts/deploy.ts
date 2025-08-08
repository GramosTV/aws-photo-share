#!/usr/bin/env tsx
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand, ListDistributionsCommand } from '@aws-sdk/client-cloudfront';
import { glob } from 'glob';
import { lookup } from 'mime-types';

// ES Module equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeployConfig {
  region: string;
  bucketName: string;
  distributionId?: string;
  buildDir: string;
}

class FrontendDeployer {
  private s3Client: S3Client;
  private cloudFrontClient: CloudFrontClient;
  private config: DeployConfig;

  constructor(config: DeployConfig) {
    this.config = config;
    this.s3Client = new S3Client({ region: config.region });
    this.cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront API is always us-east-1
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting frontend deployment...');

    try {
      // Step 1: Build the frontend
      await this.buildFrontend();

      // Step 2: Get or find distribution ID
      if (!this.config.distributionId) {
        this.config.distributionId = await this.findDistributionId();
      }

      // Step 3: Sync files to S3
      await this.syncToS3();

      // Step 4: Invalidate CloudFront cache
      await this.invalidateCloudFront();

      console.log('✅ Frontend deployment completed successfully!');
      console.log(`🌐 Your app is available at: https://${await this.getDistributionDomain()}`);
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  private async buildFrontend(): Promise<void> {
    console.log('📦 Building frontend...');

    try {
      execSync('npm run build', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log('✅ Frontend build completed');
    } catch (error) {
      throw new Error('Frontend build failed');
    }
  }

  private async findDistributionId(): Promise<string> {
    console.log('🔍 Finding CloudFront distribution...');

    try {
      const command = new ListDistributionsCommand({});
      const response = await this.cloudFrontClient.send(command);

      const distribution = response.DistributionList?.Items?.find((dist) =>
        dist.Origins?.Items?.some((origin) => origin.DomainName?.includes(this.config.bucketName))
      );

      if (!distribution?.Id) {
        throw new Error(`CloudFront distribution not found for bucket: ${this.config.bucketName}`);
      }

      console.log(`✅ Found distribution: ${distribution.Id}`);
      return distribution.Id;
    } catch (error) {
      throw new Error(`Failed to find CloudFront distribution: ${error}`);
    }
  }

  private async syncToS3(): Promise<void> {
    console.log('📤 Syncing files to S3...');

    const buildPath = path.resolve(__dirname, '..', this.config.buildDir);

    if (!existsSync(buildPath)) {
      throw new Error(`Build directory not found: ${buildPath}`);
    }

    // Get all files in build directory
    const files = glob.sync('**/*', {
      cwd: buildPath,
      nodir: true,
    });

    console.log(`📁 Found ${files.length} files to upload`);

    // Upload each file
    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(buildPath, file);
      const fileContent = readFileSync(filePath);
      const contentType = lookup(file) || 'application/octet-stream';

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: file.replace(/\\/g, '/'), // Normalize path separators
        Body: fileContent,
        ContentType: contentType,
        CacheControl: this.getCacheControl(file),
      });

      await this.s3Client.send(command);
      console.log(`✅ Uploaded: ${file}`);
    });

    await Promise.all(uploadPromises);
    console.log('✅ All files uploaded to S3');
  }

  private getCacheControl(file: string): string {
    // Cache static assets for 1 year, HTML files for 1 hour
    if (file.includes('assets/') && (file.endsWith('.js') || file.endsWith('.css'))) {
      return 'public, max-age=31536000, immutable';
    }
    return 'public, max-age=3600';
  }

  private async invalidateCloudFront(): Promise<void> {
    if (!this.config.distributionId) {
      throw new Error('Distribution ID not found');
    }

    console.log('♻️  Invalidating CloudFront cache...');

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.config.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/*'],
          },
          CallerReference: `deploy-${Date.now()}`,
        },
      });

      const response = await this.cloudFrontClient.send(command);
      console.log(`✅ Cache invalidation started: ${response.Invalidation?.Id}`);
      console.log('⏳ Note: Cache invalidation may take 5-15 minutes to complete');
    } catch (error) {
      throw new Error(`CloudFront invalidation failed: ${error}`);
    }
  }

  private async getDistributionDomain(): Promise<string> {
    if (!this.config.distributionId) {
      return 'unknown';
    }

    try {
      const command = new ListDistributionsCommand({});
      const response = await this.cloudFrontClient.send(command);

      const distribution = response.DistributionList?.Items?.find((dist) => dist.Id === this.config.distributionId);

      return distribution?.DomainName || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Read deployment configuration
async function getDeployConfig(): Promise<DeployConfig> {
  const cdkOutputsPath = path.resolve(__dirname, '../../backend/infra/cdk-outputs.json');

  if (!existsSync(cdkOutputsPath)) {
    throw new Error('CDK outputs not found. Please deploy the infrastructure first.');
  }

  const cdkOutputs = JSON.parse(readFileSync(cdkOutputsPath, 'utf-8'));
  const stackOutputs = cdkOutputs['photo-share-dev'];

  if (!stackOutputs) {
    throw new Error('Stack outputs not found in CDK outputs');
  }

  // Extract bucket name from the outputs
  const frontendBucketName = Object.entries(stackOutputs).find(
    ([key]) => key.toLowerCase().includes('frontend') && key.toLowerCase().includes('bucket')
  )?.[1] as string;

  if (!frontendBucketName) {
    // Fallback: construct bucket name from pattern
    const bucketName = `frontend-dev-${stackOutputs.PhotosBucketName?.split('-').pop()}`;
    console.log(`⚠️  Frontend bucket name not found in outputs, using: ${bucketName}`);

    return {
      region: 'eu-central-1',
      bucketName,
      buildDir: 'dist',
    };
  }

  return {
    region: 'eu-central-1',
    bucketName: frontendBucketName,
    buildDir: 'dist',
  };
}

// Main execution
async function main(): Promise<void> {
  console.log('🚀 Frontend Deployment Script');
  console.log('================================');
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Script path: ${import.meta.url}`);

  try {
    const config = await getDeployConfig();
    console.log(`📋 Configuration:`);
    console.log(`   Region: ${config.region}`);
    console.log(`   Bucket: ${config.bucketName}`);
    console.log(`   Build Dir: ${config.buildDir}`);
    console.log('');

    const deployer = new FrontendDeployer(config);
    await deployer.deploy();
  } catch (error) {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  }
}

// Run the script immediately
main();

export { FrontendDeployer, DeployConfig };

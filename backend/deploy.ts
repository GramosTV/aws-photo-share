import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Backend deployment script with build integration
 * Handles CDK bootstrapping, building Lambda functions, and infrastructure deployment
 */

const INFRA_DIR = path.join(__dirname, 'infra');
const LAMBDA_DIR = path.join(__dirname, 'lambda');

function runCommand(command: string, description: string): void {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    process.exit(1);
  }
}

async function deployBackend(): Promise<void> {
  console.log('🚀 Starting backend deployment with build...\n');

  // Step 1: Install dependencies for infrastructure
  runCommand(`cd "${INFRA_DIR}" && npm install`, 'Installing infrastructure dependencies');

  // Step 2: Install dependencies for Lambda functions
  runCommand(`cd "${LAMBDA_DIR}" && npm install`, 'Installing Lambda function dependencies');

  // Step 3: Build Lambda functions
  runCommand(`cd "${LAMBDA_DIR}" && npm run build`, 'Building Lambda functions');

  // Step 4: Bootstrap CDK (if needed)
  console.log('\n🔧 Checking CDK bootstrap status...');
  try {
    execSync(`cd "${INFRA_DIR}" && npx cdk bootstrap`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    console.log('✅ CDK bootstrap completed');
  } catch (error) {
    console.log('ℹ️ CDK already bootstrapped or bootstrap not needed');
  }

  // Step 5: Deploy infrastructure
  runCommand(`cd "${INFRA_DIR}" && npx cdk deploy --require-approval never`, 'Deploying infrastructure');

  console.log('\n🎉 Backend deployment completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Update frontend configuration with new API endpoints');
  console.log('   2. Deploy frontend using: npm run deploy');
  console.log('   3. Test the application');
}

// Run deployment
deployBackend().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});

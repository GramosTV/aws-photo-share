#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PhotoShareStack } from '../lib/photo-share-stack.js';

const app = new cdk.App();

const env = app.node.tryGetContext('env') || 'dev';

new PhotoShareStack(app, `PhotoShareStack-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
  environment: env,
  stackName: `photo-share-${env}`,
});

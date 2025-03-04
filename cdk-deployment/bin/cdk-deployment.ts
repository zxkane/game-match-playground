#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDeploymentStack } from '../lib/cdk-deployment-stack';

const app = new cdk.App();
new CdkDeploymentStack(app, 'CdkDeploymentStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
  },
});

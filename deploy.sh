#!/bin/bash

# Exit on error
set -e

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  echo "AWS CLI is not configured. Please configure it with 'aws configure'."
  exit 1
fi

# Check if environment variables are set
if [ -z "$OIDC_CLIENT_ID" ] || [ -z "$OIDC_CLIENT_SECRET" ] || [ -z "$OIDC_ISSUER_URL" ] || [ -z "$NEXTAUTH_SECRET" ]; then
  echo "Please set the following environment variables:"
  echo "OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER_URL, NEXTAUTH_SECRET"
  exit 1
fi

# Build the Next.js application
echo "Building Next.js application..."
# Skip static optimization during the build process
# NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Build the CDK application
echo "Building CDK application..."
cd cdk-deployment
npm install
npm run build

# Deploy the CDK stack
echo "Deploying CDK stack..."
cdk deploy --require-approval never

# Get the API Gateway URL
API_URL=$(aws cloudformation describe-stacks --stack-name CdkDeploymentStack --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text --region cn-north-1)

if [ -n "$API_URL" ]; then
  echo "Deployment successful!"
  echo "API Gateway URL: $API_URL"
  
  # Update .env.production with the API Gateway URL
  cd ..
  sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|g" .env.production
  sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$API_URL|g" .env.production
  
  echo "Updated .env.production with the API Gateway URL."
else
  echo "Deployment completed, but couldn't retrieve the API Gateway URL."
  echo "Please check the AWS CloudFormation console for the output value 'ApiGatewayUrl'."
fi

echo "Deployment process completed."

# Next.js with AWS Lambda Web Adapter

This project demonstrates how to deploy a Next.js application to AWS Lambda using the AWS Lambda Web Adapter. The application is deployed to AWS API Gateway + Lambda, while using Amplify for backend services.

## Prerequisites

- Node.js 20.x
- AWS CLI configured for cn-north-1 region
- AWS CDK installed
- Docker installed

## Project Structure

- `/src`: Next.js application code
- `/amplify`: Amplify Gen2 backend code
- `/cdk-deployment`: CDK application for deploying to AWS

## Local Development

To run the application locally:

```bash
npm install
npm run dev
```

## Building the Docker Image

To build the Docker image locally:

```bash
docker build -t nextjs-lambda .
```

To test the Docker image locally:

```bash
docker run -p 3000:3000 nextjs-lambda
```

## Deployment

### 1. Configure Environment Variables

Update the `.env.production` file with your actual configuration values:

```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.execute-api.cn-north-1.amazonaws.com.cn/prod
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_ISSUER_URL=your-issuer-url
NEXTAUTH_URL=https://your-api-gateway-url.execute-api.cn-north-1.amazonaws.com.cn/prod
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. Deploy with CDK

```bash
cd cdk-deployment
npm run build
cdk bootstrap aws://ACCOUNT-NUMBER/cn-north-1
cdk deploy
```

After deployment, the CDK will output the API Gateway URL, which you can use to access your application.

### 3. Update Environment Variables

After deployment, update the `.env.production` file with the actual API Gateway URL:

```
NEXT_PUBLIC_API_URL=https://your-actual-api-gateway-url.execute-api.cn-north-1.amazonaws.com.cn/prod
NEXTAUTH_URL=https://your-actual-api-gateway-url.execute-api.cn-north-1.amazonaws.com.cn/prod
```

## Architecture

This project uses the following architecture:

- Next.js application packaged in a Docker container
- AWS Lambda Web Adapter to run the Next.js app in Lambda
- API Gateway to route HTTP requests to the Lambda function
- Amplify backend for authentication and data storage

## Key Files

- `next.config.js`: Next.js configuration with standalone output
- `Dockerfile`: Docker configuration for building the application
- `run.sh`: Script to run the Next.js application in Lambda
- `cdk-deployment/`: CDK code for deploying to AWS

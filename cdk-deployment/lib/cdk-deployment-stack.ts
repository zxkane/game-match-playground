import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as path from 'path';

export class CdkDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Docker image asset
    const dockerImageAsset = new cdk.aws_ecr_assets.DockerImageAsset(this, 'NextjsImage', {
      directory: path.join(__dirname, '../../'), // Path to the directory containing Dockerfile
      buildArgs: {
        OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || '',
        OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || '',
        OIDC_ISSUER_URL: process.env.OIDC_ISSUER_URL || '',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      }
    });

    // Create Lambda function from Docker image
    const nextjsLambda = new lambda.DockerImageFunction(this, 'NextjsLambdaFunction', {
      code: lambda.DockerImageCode.fromEcr(dockerImageAsset.repository, {
        tag: dockerImageAsset.imageTag,
      }),
      memorySize: 2048, // 2GB as requested
      timeout: cdk.Duration.seconds(29), // 29 seconds as requested
      environment: {
        NODE_ENV: 'production',
        OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || '',
        OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || '',
        OIDC_ISSUER_URL: process.env.OIDC_ISSUER_URL || '',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      },
    });

    // Create HTTP API Gateway (no stage name required)
    const httpApi = new apigatewayv2.HttpApi(this, 'NextjsHttpApi', {
      apiName: 'Nextjs Service',
      description: 'HTTP API Gateway for Next.js application',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false, // Explicitly set to false when using wildcard origin
      },
    });

    // Create Lambda integration for HTTP API
    const lambdaIntegration = new apigatewayv2_integrations.HttpLambdaIntegration(
      'NextjsLambdaIntegration',
      nextjsLambda
    );

    // Add routes to HTTP API Gateway
    // Add catch-all route for proxy requests
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Add root route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Output the HTTP API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.apiEndpoint,
      description: 'URL of the HTTP API Gateway',
    });
  }
}

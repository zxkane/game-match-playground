This is an [AWS Amplify](https://aws.amazon.com/amplify/) with [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the dependencies:

```bash
npm install
```

This project uses [API-Football](https://rapidapi.com/api-sports/api/api-football) to get football data. You need to sign up and get an API key. Store your API key in the `RAPID_API_KEY` as a secret for Amplify.

```bash
npx ampx sandbox secret set RAPID_API_KEY
```

Then, deploy the cloud infrastructure on AWS sandbox:

```bash
npx ampx sandbox
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Architecture

```mermaid
flowchart TD
    User([User]) --> AmplifyHosting[Amplify Hosting<br>with CI/CD Pipeline]
    GitHub[(GitHub)] --> AmplifyHosting
    
    AmplifyHosting -->|Deploys Frontend| FrontendApp
    AmplifyHosting -->|Deploys Backend| BackendSystem
    
    subgraph "Frontend"
        FrontendApp[Next.js Application]
        FrontendApp --> AmplifyUI[Amplify UI]
        AmplifyUI --> AIComponents["AI Generation<br>& Chat Components"]
    end
    
    subgraph "Backend (Amplify Gen2)"
        BackendSystem[Amplify Gen2 Backend]
        style BackendSystem fill:none,stroke:none
        
        FrontendApp --> AppSync[AWS AppSync]
        AppSync --> DynamoDB[(DynamoDB)]
        
        FrontendApp --> Cognito[(AWS Cognito)]
        Cognito --> FrontendApp
        Cognito -.->|Authentication| AppSync
        
        AIComponents -->|GraphQL API| AppSync
        AIComponents -->|WebSocket| AppSync
        
        subgraph "AppSync JS Resolvers"
            AppSync --> GameHandlers[Game Handlers]
            AppSync --> LeagueHandlers[League Handlers]
        end
        
        AppSync -->|HTTP Integration| Bedrock[Amazon Bedrock]
        AppSync --> AILambda[AI Lambda Functions]
        AILambda --> Bedrock
        AILambda -->|WebSocket Response| AIComponents
        
        %% Invisible connection to ensure backend system node is part of layout
        BackendSystem -.-> AppSync
    end
```

## AWS China Region Deployment

If you need to deploy this application to AWS China regions, check out the [`aws-china-migration`](https://github.com/zxkane/game-match-playground/tree/aws-china-migration) branch which contains specific adaptations:

1. **External Authentication**: Uses external OIDC provider for authentication instead of Cognito User Pool (not available in China regions)
2. **AppSync Authentication**: Configures AppSync to work with the external OIDC provider
3. **UI Modifications**: Disables Amplify UI features that depend on Amazon Bedrock (not available in China regions)
4. **CDK-Based Deployment**: Uses AWS CDK with Lambda Web Adapter and API Gateway instead of Amplify Hosting

The `aws-china-migration` branch includes a comprehensive architecture diagram and detailed setup instructions for deploying to AWS China regions.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/what-is-amplify.html) - learn about AWS Amplify features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Amplify Hosting

View the [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/getting-started.html) documentation for more information.

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, leagueHandler } from './data/resource';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { IRole, PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { CROSS_REGION_INFERENCE, CUSTOM_MODEL_ID } from './constants';
import { getCrossRegionModelId, getCurrentRegion } from './utils';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export const backend = defineBackend({
  auth,
  data,
  leagueHandler,
});

const externalTableStack = backend.createStack('ExternalTableStack');

const leagueTable = new Table(externalTableStack, 'League', {
  partitionKey: {
    name: 'id',
    type: AttributeType.STRING
  },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.DESTROY,
});

backend.data.addDynamoDbDataSource(
  "ExternalLeagueTableDataSource",
  leagueTable as any
);

leagueTable.grantReadWriteData(backend.leagueHandler.resources.lambda);
(backend.leagueHandler.resources.lambda.node.defaultChild as CfnFunction).addPropertyOverride('LoggingConfig', {
  LogFormat: 'JSON',
  ApplicationLogLevel: process.env.PRODUCTION ? 'WARN' : 'TRACE',
  SystemLogLevel: 'INFO',
});
(backend.leagueHandler.resources.lambda as NodejsFunction).addEnvironment('LEAGUE_TABLE_NAME', leagueTable.tableName);

// specify the ttl for gameviewer table
const gameViewerTable = backend.data.resources.cfnResources.amplifyDynamoDbTables?.['GameViewer'];
if (gameViewerTable) {
  gameViewerTable.timeToLiveAttribute = {
    attributeName: 'lastSeen',
    enabled: true,
  };
}

function createBedrockPolicyStatement(currentRegion: string, accountId: string, modelId: string, crossRegionModel: string) {
  return new PolicyStatement({
    resources: [
      `arn:aws:bedrock:*::foundation-model/${modelId}`,
      `arn:aws:bedrock:${currentRegion}:${accountId}:inference-profile/${crossRegionModel}`,
    ],
    actions: ['bedrock:InvokeModel*'],
  });
}

// Update the chat conversation section
if (CROSS_REGION_INFERENCE && CUSTOM_MODEL_ID) {
  const currentRegion = getCurrentRegion(backend.stack);
  const crossRegionModel = getCrossRegionModelId(currentRegion, CUSTOM_MODEL_ID);
  
  // [chat converstation]
  const chatStack = backend.data.resources.nestedStacks?.['ChatConversationDirectiveLambdaStack'];
  if (chatStack) {
    const conversationFunc = chatStack.node.findAll()
      .find(child => child.node.id === 'conversationHandlerFunction') as IFunction;

    if (conversationFunc) {
      conversationFunc.addToRolePolicy(
        createBedrockPolicyStatement(currentRegion, backend.stack.account, CUSTOM_MODEL_ID, crossRegionModel)
      );
    }
  }

  // [insights generation]
  const insightsStack = backend.data.resources.nestedStacks?.['GenerationBedrockDataSourceGenerateInsightsStack'];
  if (insightsStack) {
    const dataSourceRole = insightsStack.node.findChild('GenerationBedrockDataSourceGenerateInsightsIAMRole') as IRole;
    if (dataSourceRole) {
      dataSourceRole.attachInlinePolicy(
        new Policy(insightsStack, 'CrossRegionInferencePolicy', {
          statements: [
            createBedrockPolicyStatement(currentRegion, backend.stack.account, CUSTOM_MODEL_ID, crossRegionModel)
          ],
        }),
      );
    }
  }
}

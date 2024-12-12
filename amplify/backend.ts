import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data, leagueHandler } from './data/resource';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';


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
  leagueTable
);

leagueTable.grantReadWriteData(backend.leagueHandler.resources.lambda);
(backend.leagueHandler.resources.lambda.node.defaultChild as CfnFunction).addPropertyOverride('LoggingConfig', {
  LogFormat: 'JSON',
  ApplicationLogLevel: process.env.PRODUCTION ? 'WARN' : 'TRACE',
  SystemLogLevel: 'INFO',
});
(backend.leagueHandler.resources.lambda as NodejsFunction).addEnvironment('LEAGUE_TABLE_NAME', leagueTable.tableName);

// speicfy the ttl for gameviewer table
backend.data.resources.cfnResources.amplifyDynamoDbTables['GameViewer'].timeToLiveAttribute = {
  attributeName: 'lastSeen',
  enabled: true,
};

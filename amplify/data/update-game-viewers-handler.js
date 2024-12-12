import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId, userId, username } = ctx.args;
  const now = new Date().toISOString();

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ gameId, userId }),
    attributeValues: util.dynamodb.toMapValues({
      username,
      lastSeen: now
    }),
    table: 'GameViewers',
  };
}

export function response(ctx) {
  // Query active viewers after updating
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  return {
    operation: 'Query',
    query: {
      expression: 'gameId = :gameId',
      expressionValues: {
        ':gameId': { S: ctx.args.gameId }
      }
    },
    filter: {
      expression: 'lastSeen > :threshold',
      expressionValues: {
        ':threshold': { S: oneMinuteAgo }
      }
    },
    table: 'GameViewers',
  };
} 
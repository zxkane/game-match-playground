import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId } = ctx.args;
  const tenMinutesAgo = util.time.nowEpochSeconds() - (60 * 10);

  return {
    operation: 'Query',
    index: 'listByGameIdOrderByLastSeen',
    query: {
      expression: 'gameId = :gameId and lastSeen > :threshold',
      expressionValues: util.dynamodb.toMapValues({
        ':gameId': gameId,
        ':threshold': tenMinutesAgo,
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
} 
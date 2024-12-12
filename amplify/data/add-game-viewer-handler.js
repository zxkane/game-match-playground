import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId } = ctx.args;
  const { username, sub: userId } = ctx.identity;

  if (!gameId || !userId) {
    util.error('Missing required fields', 'ValidationError');
  }

  const now = util.time.nowISO8601();
  const epochNow = util.time.nowEpochSeconds();

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ 
      gameId,
      userId 
    }),
    update: {
      expression: `SET username = :username, lastSeen = :lastSeen, updatedAt = :updatedAt, 
                  createdAt = if_not_exists(createdAt, :createdAt)`,
      expressionValues: util.dynamodb.toMapValues({
        ':username': ctx.identity.claims.email || username,
        ':lastSeen': epochNow,
        ':updatedAt': now,
        ':createdAt': now,
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(
      ctx.error.message || 'Error updating game viewer',
      ctx.error.type || 'GameViewerError'
    );
  }
  
  if (!ctx.result) {
    util.error('No result returned', 'GameViewerError');
  }

  return ctx.result;
} 
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId } = ctx.args;
  const { matchIndex } = ctx.stash;
  const game = ctx.prev.result;

  // Get matches array and remove the match at specified index
  const matches = [...(game.matches || [])];
  matches.splice(matchIndex, 1);

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ id: gameId }),
    update: {
      expression: 'SET #matches = :matches, #updatedAt = :updatedAt',
      expressionNames: {
        '#matches': 'matches',
        '#updatedAt': 'updatedAt',
        '#status': 'status'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':matches': matches,
        ':updatedAt': util.time.nowISO8601(),
        ':activeStatus': 'active'
      })
    },
    condition: {
      expression: '#status = :activeStatus'
    }
  };
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    util.error(error.message);
  }
  return result;
} 
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId, homeTeamId, awayTeamId, homeScore, awayScore, date } = ctx.args;
  const game = ctx.prev.result;

  // Create new match object
  const newMatch = {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    date,
    createdAt: util.time.nowISO8601(),
  };

  // Add match to game's matches array
  const currentMatches = game.matches || [];
  currentMatches.push(newMatch);

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
        ':matches': currentMatches,
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
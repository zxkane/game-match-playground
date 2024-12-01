import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId, teamId } = ctx.args;
  const game = ctx.prev.result;

  const currentTeams = game.teams || [];
  const updatedTeams = currentTeams.filter(team => team.team.id !== teamId);

  if (currentTeams.length === updatedTeams.length) {
    util.error('Team not found in game');
  }

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ id: gameId }),
    update: {
      expression: 'SET #teams = :teams, #updatedAt = :updatedAt',
      expressionNames: {
        '#teams': 'teams',
        '#updatedAt': 'updatedAt'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':teams': updatedTeams,
        ':updatedAt': util.time.nowISO8601()
      })
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
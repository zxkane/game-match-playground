import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId, teamId, teamName, teamLogo, player } = ctx.args;
  const game = ctx.prev.result;

  const newTeamPlayer = {
    team: {
      id: teamId,
      name: teamName,
      logo: teamLogo
    },
    player: player || null
  };

  const currentTeams = game.teams || [];
  currentTeams.push(newTeamPlayer);

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
        ':teams': currentTeams,
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
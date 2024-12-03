import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId } = ctx.args;
  
  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({ id: gameId })
  };
}

export function response(ctx) {
  const { result, args } = ctx;
  const { homeTeamId, awayTeamId } = args;
  
  if (!result) {
    util.error('Game not found');
  }

  if (result.status !== 'active') {
    util.error('Cannot add match to game - game is not in active status');
  }

  // Validate teams exist in the game
  const teams = result.teams || [];
  const homeTeam = teams.find(t => t.team.id === homeTeamId);
  const awayTeam = teams.find(t => t.team.id === awayTeamId);

  if (!homeTeam) {
    util.error('Home team not found in game');
  }
  if (!awayTeam) {
    util.error('Away team not found in game');
  }
  if (homeTeam.team.id === awayTeam.team.id) {
    util.error('Home team and away team cannot be the same');
  }
  // Store validated data in stash for next resolver
  ctx.stash.game = result;
  ctx.stash.homeTeam = homeTeam;
  ctx.stash.awayTeam = awayTeam;

  return result;
} 
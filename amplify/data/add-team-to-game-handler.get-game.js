import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { gameId } = ctx.args;
  
  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({ id: gameId })
  };
}

export function response(ctx) {
  const { result } = ctx;
  
  if (!result) {
    util.error('Game not found');
  }

  if (result.status !== 'draft') {
    util.error('Cannot add team to game - game is not in draft status');
  }

  // Check if the team is already added
  const { teamId } = ctx.args;
  let teamExists = false;
  const teams = result.teams || [];
  
  for (const team of teams) {
    if (team.team.id === teamId) {
      teamExists = true;
      break;
    }
  }
  
  if (teamExists) {
    util.error('Team is already added to the game');
  }

  // Store the current game in stash for the next resolver
  ctx.stash.game = result;
  return result;
} 
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
  const { matchIndex } = args;
  
  if (!result) {
    util.error('Game not found');
  }

  if (result.status !== 'active') {
    util.error('Cannot delete match - game is not in active status');
  }

  const matches = result.matches || [];
  if (matchIndex < 0 || matchIndex >= matches.length) {
    util.error('Invalid match index');
  }

  // Store validated data in stash for next resolver
  ctx.stash.game = result;
  ctx.stash.matchIndex = matchIndex;

  return result;
} 
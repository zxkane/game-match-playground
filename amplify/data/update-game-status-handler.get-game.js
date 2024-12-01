import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { id } = ctx.args;
  
  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({ id })
  };
}

export function response(ctx) {
  const { error, result } = ctx;
  
  if (error) {
    util.error(error.message, error.type);
  }
  
  if (!result) {
    util.error('Game not found', 'NotFoundError');
  }
  
  // Pass both the current game and the new status to the next resolver
  return {
    ...result,
    newStatus: ctx.args.newStatus
  };
} 
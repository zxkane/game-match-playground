import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { name, description } = ctx.args;
  
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ 
      gameId: util.autoId(),
    }),
    attributeValues: util.dynamodb.toMapValues({
      name,
      description,
      owner: ctx.identity.claims.email || ctx.identity.username,
      createdAt: util.time.nowISO8601(),
      updatedAt: util.time.nowISO8601(),
      status: 'draft',
    })
  };
}

export function response(ctx) {
  return ctx.result;
} 
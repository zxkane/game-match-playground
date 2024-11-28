import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { id, newStatus } = ctx.args;
  const owner = ctx.identity.claims.email || ctx.identity.username;
  
  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ id }),
    update: {
      expression: 'SET #status = :newStatus, #updatedAt = :updatedAt',
      expressionNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':newStatus': newStatus,
        ':updatedAt': util.time.nowISO8601()
      })
    },
    condition: {
      expression: 'attribute_exists(id)'
    }
  };
}

export function response(ctx) {
  const { error, result } = ctx;
  
  if (error) {
    util.error(error.message, error.type);
  }
  
  // Validate status transitions
  const validTransitions = {
    'draft': ['active', 'deleted'],
    'active': ['completed', 'deleted'],
    'completed': ['deleted'],
    'deleted': []
  };
  
  const currentStatus = result.status;
  const newStatus = ctx.args.newStatus;
  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    util.error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  return result;
} 
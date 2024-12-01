import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { id, status, teams, newStatus } = ctx.prev.result;
  
  const validTransitions = {
    'draft': ['active', 'deleted'],
    'active': ['completed', 'deleted'],
    'completed': ['deleted'],
    'deleted': []
  };

  const allowedTransitions = validTransitions[status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    util.error(`Invalid status transition from ${status} to ${newStatus}`, 'ValidationError');
  }

  // If transitioning to active, check team count
  if (newStatus === 'active' && (!teams || teams.length < 2)) {
    util.error('Cannot set game to active with less than 2 teams', 'ValidationError');
  }

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
  
  return result;
} 
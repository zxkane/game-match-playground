export function request(ctx) {
  return ctx.prev.result;
}

export function response(ctx) {
  const filter = {
    id: {
      eq: ctx.args.gameId,
    }
  }

  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter))
  return ctx.result;
}
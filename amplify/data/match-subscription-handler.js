import { util, extensions } from "@aws-appsync/utils"

// Subscription handlers must return a `null` payload on the request
export function request() { 
  return { payload: null } 
}

// Set subscription filter based on gameId argument
export function response(ctx) {
  const filter = {
    id: {
      eq: ctx.args.gameId
    }
  }

  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter))
  return ctx.result
}

import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  GameStatus: a.enum(['draft', 'active', 'completed']),
  Game: a.model({
    gameId: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    participants: a.string().array(),
    watchers: a.string().array(),
    owner: a.string().required(),
    createdTime: a.datetime().required(),
    updatedTime: a.datetime().required(),
    status: a.ref('GameStatus').required(),
  })
  .identifier(['owner', 'createdTime'])
  .secondaryIndexes((index) => [
    index('gameId')
  ])
  .authorization(allow => [
    allow.owner(),
    allow.ownersDefinedIn('participants').to(['read', 'update']),
    allow.ownersDefinedIn('watchers').to(['read']),
  ]),
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

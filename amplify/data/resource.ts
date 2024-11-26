import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  GameStatus: a.enum(['draft', 'active', 'completed']),
  Game: a.model({
    gameId: a.id(),
    name: a.string().required(),
    description: a.string(),
    owner: a.string().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    status: a.ref('GameStatus'),
  })
  .identifier(['gameId'])
  .disableOperations(['create', 'update'])
  .secondaryIndexes((index) => [
    index('owner').sortKeys(['updatedAt']).queryField('listByOwner')
  ])
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.ownerDefinedIn('owner'),
  ]),
  
  customCreateGame: a.mutation()
    .arguments({
      name: a.string().required(),
      description: a.string(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.custom({
      dataSource: a.ref('Game'),
      entry: './create-game-handler.js'
    }))
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

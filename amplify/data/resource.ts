import { a, defineData, type ClientSchema, defineFunction } from '@aws-amplify/backend';

const leaguesHandler = defineFunction({
  entry: './league-handler/handler.ts'
})

const schema = a.schema({
  GameStatus: a.enum(['draft', 'active', 'completed', 'deleted']),
  TeamPlayer: a.customType({
    team: a.string().required(),
    player: a.string(),
  }),
  Game: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    owner: a.string().required(),
    teams: a.ref('TeamPlayer').array(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    status: a.ref('GameStatus'),
  })
  .identifier(['id'])
  .disableOperations(['create', 'update', 'delete'])
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
    })),

  updateGameStatus: a.mutation()
    .arguments({
      id: a.string().required(),
      newStatus: a.enum(['active', 'completed', 'deleted']),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [
      allow.authenticated(),
    ])
    .handler(a.handler.custom({
      dataSource: a.ref('Game'),
      entry: './update-game-status-handler.js'
    })),

  League: a.customType({
    country: a.customType({
      name: a.string().required(),
      code: a.string().required(),
      flag: a.string().required(),
    }),
    league: a.customType({
      id: a.integer().required(),
      name: a.string().required(),
      type: a.string().required(),
      logo: a.string().required(),
    }),
  }),

  leagues: a.query()
    .arguments({
      countryCode: a.string(),
    })
    .returns(a.ref('League').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(leaguesHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

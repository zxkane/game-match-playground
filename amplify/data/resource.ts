import { LLM_MODEL, LLM_SYSTEM_PROMPT, FOOTBALL_SYSTEM_PROMPT } from '@/constant';
import { a, defineData, type ClientSchema, defineFunction, secret } from '@aws-amplify/backend';

export const leaguesHandler = defineFunction({
  entry: './league-handler/leagues.ts',
  runtime: 20,
})

export const leagueHandler = defineFunction({
  entry: './league-handler/league.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    RAPID_API_KEY: secret('RAPID_API_KEY'),
  }
})

const schema = a.schema({
  GameStatus: a.enum(['draft', 'active', 'completed', 'deleted']),
  SimpleTeam: a.customType({
    id: a.string().required(),
    name: a.string().required(),
    logo: a.string(),
  }),
  TeamPlayer: a.customType({
    team: a.ref('SimpleTeam').required(),
    player: a.string(),
  }),
  Game: a.model({
    id: a.id(),
    name: a.string().required(),
    description: a.string(),
    owner: a.string().required(),
    teams: a.ref('TeamPlayer').array(),
    matches: a.ref('Match').array(),
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
    .handler([
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './update-game-status-handler.get-game.js'
      }),
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './update-game-status-handler.update-game.js'
      })
    ]),

  addTeamToGame: a.mutation()
    .arguments({
      gameId: a.string().required(),
      teamId: a.string().required(),
      teamName: a.string().required(),
      teamLogo: a.string().required(),
      player: a.string(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [
      allow.authenticated(),
    ])
    .handler([
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './add-team-to-game-handler.get-game.js'
      }),
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './add-team-to-game-handler.update-game.js'
      })
    ]),

  removeTeamFromGame: a.mutation()
    .arguments({
      gameId: a.string().required(),
      teamId: a.string().required(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [
      allow.authenticated(),
    ])
    .handler([
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './remove-team-from-game-handler.get-game.js'
      }),
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './remove-team-from-game-handler.update-game.js'
      })
    ]),

  LeagueCountry: a.customType({
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
    .returns(a.ref('LeagueCountry').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(leaguesHandler)),

  Team: a.customType({
    id: a.string().required(),
    name: a.string().required(),
    code: a.string(),
    country: a.string().required(),
    national: a.boolean().required(),
    logo: a.string(),
    founded: a.integer(),
    venue: a.customType({
      id: a.integer().required(),
      name: a.string().required(),
      address: a.string().required(),
      city: a.string().required(),
      capacity: a.integer().required(),
      surface: a.string().required(),
      image: a.string().required(),
    }),
  }),

  League: a.customType({
    id: a.string().required(),
    leagueCountry: a.ref('LeagueCountry'),
    teams: a.ref('Team').array(),
    season: a.integer(),
  }),

  league: a.query()
    .arguments({
      id: a.string().required(),
    })
    .returns(a.ref('League'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(leagueHandler)),

  Goal: a.customType({
    teamId: a.string().required(),
    playerName: a.string().required(),
    minute: a.integer().required(),
  }),

  Match: a.customType({
    homeTeamId: a.string().required(),
    awayTeamId: a.string().required(),
    homeScore: a.integer().required(),
    awayScore: a.integer().required(),
    date: a.string().required(),
    createdAt: a.datetime().required(),
  }),

  addMatch: a.mutation()
    .arguments({
      gameId: a.string().required(),
      homeTeamId: a.string().required(),
      awayTeamId: a.string().required(),
      homeScore: a.integer().required(),
      awayScore: a.integer().required(),
      date: a.string(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [
      allow.authenticated(),
    ])
    .handler([
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './add-match-handler.get-game.js'
      }),
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './add-match-handler.update-game.js'
      })
    ]),

  deleteMatch: a.mutation()
    .arguments({
      gameId: a.string().required(),
      matchIndex: a.integer().required(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [
      allow.authenticated(),
    ])
    .handler([
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './delete-match-handler.get-game.js'
      }),
      a.handler.custom({
        dataSource: a.ref('Game'),
        entry: './delete-match-handler.update-game.js'
      })
    ]),

  // Custom subscriptions for match updates
  onMatchAdded: a.subscription()
    .for(a.ref('addMatch'))
    .arguments({
      gameId: a.string().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.custom({
      entry: './match-subscription-handler.js'
    })),

  onMatchDeleted: a.subscription()
    .for(a.ref('deleteMatch'))
    .arguments({
      gameId: a.string().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.custom({
      entry: './match-subscription-handler.js'
    })),

  GameViewer: a.model({
    userId: a.string().required(),
    username: a.string().required(),
    gameId: a.string().required(),
    lastSeen: a.integer().required(),
  }).identifier(['gameId', 'userId'])
  .secondaryIndexes((index) => [
    index('gameId').sortKeys(['lastSeen']).queryField('listByLastSeen').name('listByGameIdOrderByLastSeen')
  ])
  .disableOperations(['create', 'update', 'delete'])
  .authorization(allow => allow.authenticated()),

  addGameViewer: a.mutation()
    .arguments({
      gameId: a.string().required(),
    })
    .returns(a.ref('GameViewer').array())
    .authorization(allow => [allow.authenticated()])
    .handler([
      a.handler.custom({
        entry: './add-game-viewer-handler.js',
        dataSource: a.ref('GameViewer'),
      }),
      a.handler.custom({
        entry: './get-game-viewers-handler.js',
        dataSource: a.ref('GameViewer'),
      }),
    ]),

  onGameViewersUpdated: a.subscription()
    .for(a.ref('addGameViewer'))
    .arguments({
      gameId: a.string().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        entry: './game-viewers-subscription-handler.js',
      }),
    ),

  generateInsights: a.generation({
    aiModel: a.ai.model(LLM_MODEL),
    systemPrompt: LLM_SYSTEM_PROMPT,
    inferenceConfiguration: {
      maxTokens: 1000,
      temperature: 0.65,
    },
  })
  .arguments({
    requirement: a.string().required(),
    })
    .returns(a.customType({
      insights: a.string().required(),
    }))
    .authorization(allow => [allow.authenticated()]),

  chat: a.conversation({
    aiModel: a.ai.model(LLM_MODEL),
    systemPrompt: FOOTBALL_SYSTEM_PROMPT,
  }).authorization(allow => allow.owner()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});

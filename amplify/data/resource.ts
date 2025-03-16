import { a, defineData, type ClientSchema, defineFunction, secret } from '@aws-amplify/backend';

export const leaguesHandler = defineFunction({
  entry: './league-handler/leagues.ts',
  runtime: 20,
});

export const leagueHandler = defineFunction({
  entry: './league-handler/league.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    RAPID_API_KEY: secret('RAPID_API_KEY'),
  }
});

export const standingsHandler = defineFunction({
  entry: './league-handler/standings.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    RAPID_API_KEY: secret('RAPID_API_KEY'),
  }
});

const provider = 'oidc';

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
    allow.authenticated(provider).to(['read']),
    // allow.ownerDefinedIn('owner'),
    allow.owner('oidc').identityClaim('sub'),
  ]),
  
  customCreateGame: a.mutation()
    .arguments({
      name: a.string().required(),
      description: a.string(),
    })
    .returns(a.ref('Game'))
    .authorization(allow => [allow.authenticated(provider)])
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
      allow.authenticated(provider),
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
      allow.authenticated(provider),
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
      allow.authenticated(provider),
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
    .authorization(allow => [allow.authenticated(provider)])
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
    .authorization(allow => [allow.authenticated(provider)])
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
      allow.authenticated(provider),
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
      allow.authenticated(provider),
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
    .authorization(allow => [allow.authenticated(provider)])
    .handler(a.handler.custom({
      entry: './match-subscription-handler.js'
    })),

  onMatchDeleted: a.subscription()
    .for(a.ref('deleteMatch'))
    .arguments({
      gameId: a.string().required()
    })
    .authorization(allow => [allow.authenticated(provider)])
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
  .authorization(allow => allow.authenticated(provider)),

  addGameViewer: a.mutation()
    .arguments({
      gameId: a.string().required(),
    })
    .returns(a.ref('GameViewer').array())
    .authorization(allow => [allow.authenticated(provider)])
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
    .authorization(allow => [allow.authenticated(provider)])
    .handler(
      a.handler.custom({
        entry: './game-viewers-subscription-handler.js',
      }),
    ),

  // generateInsights: a.generation({
  //   aiModel: CROSS_REGION_INFERENCE ? {
  //     resourcePath: getCrossRegionModelId(getCurrentRegion(undefined), CUSTOM_MODEL_ID!),
  //    } : a.ai.model(LLM_MODEL),
  //   systemPrompt: LLM_SYSTEM_PROMPT,
  //   inferenceConfiguration: {
  //     maxTokens: 1000,
  //     temperature: 0.65,
  //   },
  // })
  // .arguments({
  //   requirement: a.string().required(),
  //   })
  //   .returns(a.customType({
  //     insights: a.string().required(),
  //   }))
  //   .authorization(allow => [allow.authenticated(provider)]),

//   chat: a.conversation({
//     aiModel: CROSS_REGION_INFERENCE ? {
//       resourcePath: getCrossRegionModelId(getCurrentRegion(undefined), CUSTOM_MODEL_ID!),
//      } : a.ai.model(LLM_MODEL),
//     systemPrompt: `${FOOTBALL_SYSTEM_PROMPT}

// When asked about current standings or this season's standings, first determine the correct season below rules, then use that season parameter with the standings query.
// For example:
// 1. Use current date to determine the season. 
//   - For most european leagues, the season starts in August and ends in May.
//     1. If the current date is between August and May, use the current year as the season number.
//     2. If the current date is before August or after May, use the previous year as the season number.
//   - For the leagues in Asia, the season starts in July and ends in June. For example, China Super League.
// 2. Use that season number in the standings query`,
//     tools: [
//       a.ai.dataTool({
//         name: 'leagues',
//         description: `
//           Get a list of available leagues and their IDs.
//           Use this first to find the league ID when user mentions a league by name.
//           You can filter by countryCode.
//         `.trim().replace(/\n\s+/g, ' '),
//         query: a.ref('leagues'),
//       }),
//       a.ai.dataTool({
//         name: 'standings',
//         description: `
//           Get current standings for a specific league and season. It also includes the home and away performances of the team.
//           The team result includes the details of the team's performance(home/away/total) in the league.
//           Use this after finding the league ID to get standings information.
//           Use the start year of the season as the season parameter, for example, 2024 for the 2024/2025 season.
//         `.trim().replace(/\n\s+/g, ' '),
//         query: a.ref('standings'),
//       }),
//     ],
//   }).authorization(allow => allow.owner()),

  LeagueStanding: a.customType({
    rank: a.integer().required(),
    team: a.customType({
      id: a.integer().required(),
      name: a.string().required(),
      logo: a.string().required(),
    }),
    points: a.integer().required(),
    goalsDiff: a.integer().required(),
    group: a.string(),
    form: a.string(),
    status: a.string(),
    description: a.string(),
    all: a.customType({
      played: a.integer().required(),
      win: a.integer().required(),
      draw: a.integer().required(),
      lose: a.integer().required(),
      goals: a.customType({
        for: a.integer().required(),
        against: a.integer().required(),
      }),
    }),
    home: a.customType({
      played: a.integer().required(),
      win: a.integer().required(),
      draw: a.integer().required(),
      lose: a.integer().required(),
      goals: a.customType({
        for: a.integer().required(),
        against: a.integer().required(),
      }),
    }),
    away: a.customType({
      played: a.integer().required(),
      win: a.integer().required(),
      draw: a.integer().required(),
      lose: a.integer().required(),
      goals: a.customType({
        for: a.integer().required(),
        against: a.integer().required(),
      }),
    }),
    update: a.string().required(),
  }),

  standings: a.query()
    .arguments({
      leagueId: a.integer().required(),
      season: a.integer().required(),
    })
    .returns(a.ref('LeagueStanding').array())
    .authorization(allow => [allow.authenticated(provider)])
    .handler(a.handler.function(standingsHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'oidc',
    oidcAuthorizationMode: {
      oidcProviderName: process.env.OIDC_ISSUER_URL!,
      clientId: process.env.OIDC_CLIENT_ID!,
      oidcIssuerUrl: process.env.OIDC_ISSUER_URL!,
      tokenExpiryFromAuthInSeconds: 3600,
      tokenExpireFromIssueInSeconds: 3600
    }
  }
});

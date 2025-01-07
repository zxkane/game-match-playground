import { Schema } from "../resource";
import axios from "axios";
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'standings-handler',
  logLevel: 'INFO'
});

const RAPID_API_KEY = process.env.RAPID_API_KEY;

type StandingType = Schema["LeagueStanding"]["type"];

export const handler: Schema["standings"]["functionHandler"] = async (event, context) => {
  const { leagueId, season } = event.arguments;

  logger.addContext(context);
  logger.info('Processing standings request', { leagueId, season });

  try {
    // Call the API-Football standings endpoint
    logger.info('Fetching standings from API', { leagueId, season });
    const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/standings`, {
      params: {
        league: leagueId,
        season: season
      },
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    if (!response.data?.response?.[0]?.league?.standings?.[0]) {
      logger.error('No standings found', { leagueId, season });
      throw new Error('No standings found for the specified league and season');
    }

    // Transform the API response to match our schema
    logger.debug('Transforming API response to schema format');
    const standings = response.data.response[0].league.standings[0];
    
    const transformedStandings: StandingType[] = standings.map((standing: any) => ({
      rank: standing.rank,
      team: {
        id: standing.team.id,
        name: standing.team.name,
        logo: standing.team.logo,
      },
      points: standing.points,
      goalsDiff: standing.goalsDiff,
      group: standing.group,
      form: standing.form,
      status: standing.status,
      description: standing.description,
      all: {
        played: standing.all.played,
        win: standing.all.win,
        draw: standing.all.draw,
        lose: standing.all.lose,
        goals: {
          for: standing.all.goals.for,
          against: standing.all.goals.against,
        },
      },
      home: {
        played: standing.home.played,
        win: standing.home.win,
        draw: standing.home.draw,
        lose: standing.home.lose,
        goals: {
          for: standing.home.goals.for,
          against: standing.home.goals.against,
        },
      },
      away: {
        played: standing.away.played,
        win: standing.away.win,
        draw: standing.away.draw,
        lose: standing.away.lose,
        goals: {
          for: standing.away.goals.for,
          against: standing.away.goals.against,
        },
      },
      update: standing.update,
    }));

    logger.info('Successfully processed standings request', { 
      leagueId, 
      season,
      standingsCount: transformedStandings.length 
    });

    return transformedStandings;
  } catch (error) {
    logger.error('Error processing standings request', { 
      leagueId,
      season,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}; 
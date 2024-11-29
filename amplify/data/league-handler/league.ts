import { Schema } from "../resource";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import { Logger } from '@aws-lambda-powertools/logger';
import leaguesData from './football/leagues.json';

const logger = new Logger({
  serviceName: 'league-handler',
  logLevel: 'INFO'
});

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME;

type LeagueType = Schema["League"]["type"];

export const handler: Schema["league"]["functionHandler"] = async (event, context) => {
  const { id } = event.arguments;
  const currentYear = 2024;

  logger.addContext(context);
  logger.info('Processing league request', { leagueId: id, year: currentYear });

  try {
    // 1. Try to get the league from DynamoDB
    logger.debug('Attempting to fetch league from DynamoDB', { leagueId: id });
    const getResult = await ddbDocClient.send(new GetCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: { id }
    }));

    if (getResult.Item) {
      logger.info('League found in DynamoDB cache', { leagueId: id });
      return getResult.Item as LeagueType;
    }

    // 2. If not found, call the football API
    logger.info('League not found in cache, fetching from API', { leagueId: id });
    const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/teams?league=${id}&season=${currentYear}`, {
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    if (!response.data?.response?.[0]) {
      logger.error('League not found in API', { leagueId: id });
      throw new Error('League not found');
    }

    const apiData = response.data.response[0];
    logger.debug('Received API response', { 
      leagueId: id, 
      leagueName: apiData.league?.name,
      countryName: apiData.country?.name 
    });

    // 3. Transform the API data to match our schema
    logger.debug('Transforming API data to schema format');
    const leagueInfo = leaguesData.find(l => l.league.id === parseInt(id));
    
    if (!leagueInfo) {
      logger.error('League info not found in leagues.json', { leagueId: id });
      throw new Error('League not supported');
    }

    const transformedData: LeagueType = {
      id,
      leagueCountry: {
        country: leagueInfo.country,
        league: leagueInfo.league
      },
      teams: response.data.response.map((item: any) => ({
        id: item.team.id.toString(),
        name: item.team.name,
        code: item.team.code,
        country: item.team.country,
        national: item.team.national,
        logo: item.team.logo,
        founded: item.team.founded,
        venue: item.venue ? {
          id: item.venue.id.toString(),
          name: item.venue.name,
          address: item.venue.address,
          city: item.venue.city,
          capacity: item.venue.capacity,
          surface: item.venue.surface,
          image: item.venue.image
        } : undefined
      })),
      season: currentYear
    };

    logger.debug('Data transformation complete', { 
      leagueId: id,
      teamsCount: transformedData.teams?.length ?? 0 
    });

    // 4. Save the transformed data to DynamoDB using upsert
    logger.info('Saving transformed data to DynamoDB', { leagueId: id });
    await ddbDocClient.send(new UpdateCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: { id },
      UpdateExpression: `
        SET leagueCountry = :leagueCountry,
            teams = :teams,
            season = :season
      `,
      ExpressionAttributeValues: {
        ':leagueCountry': transformedData.leagueCountry,
        ':teams': transformedData.teams,
        ':season': transformedData.season
      }
    }));

    logger.info('Successfully processed league request', { 
      leagueId: id,
      teamsCount: transformedData.teams?.length ?? 0,
      cached: false
    });

    // 5. Return the transformed data
    return transformedData;
  } catch (error) {
    logger.error('Error processing league request', { 
      leagueId: id, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

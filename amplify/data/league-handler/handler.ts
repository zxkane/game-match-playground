import type { Schema } from '../resource';
import leagues from './football/leagues.json';

export const handler: Schema["leagues"]["functionHandler"] = async (event, context) => {
  const { countryCode } = event.arguments;

  const sortedLeagues = leagues
    .sort((a, b) => {
      // First sort by country code
      const codeCompare = a.country.code.localeCompare(b.country.code);
      if (codeCompare !== 0) return codeCompare;
      
      // Then sort by league name
      return a.league.name.localeCompare(b.league.name);
    })
    .reduce((acc, league) => {
      const countryCode = league.country.code;
      const existingCount = acc.filter(l => l.country.code === countryCode).length;
      if (existingCount < 3) {
        acc.push(league);
      }
      return acc;
    }, [] as typeof leagues);

  if (countryCode) {
    return sortedLeagues.filter(league => league.country.code === countryCode);
  }

  return sortedLeagues;
};

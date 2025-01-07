import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {};
}

export function response(ctx) {
  const now = util.time.nowISO8601();
  const epochMillis = util.time.nowEpochMilliSeconds();
  const formatted = util.time.epochMilliSecondsToFormatted(epochMillis, "MM-yyyy");
  const [month, year] = formatted.split("-").map(s => +s);
  
  return {
    currentDate: now,
    season: month >= 7 ? year : year - 1,
  };
} 
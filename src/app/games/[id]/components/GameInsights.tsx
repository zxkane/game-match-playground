'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Paper, CircularProgress, Alert } from '@mui/material';
import { Schema } from '../../../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const client = generateClient<Schema>();

type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

interface GameInsightsProps {
  game: Schema['Game']['type'];
  standings: Standing[];
}

const GameInsights: React.FC<GameInsightsProps> = ({ game, standings }) => {
  const [insights, setInsights] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Create a cache key based on relevant data
  const getCacheKey = useCallback(() => {
    const matchesKey = game.matches
      ?.slice(-5)
      .map(m => `${m?.homeTeamId}${m?.homeScore}-${m?.awayScore}${m?.awayTeamId}`)
      .join('|');
      
    const standingsKey = standings
      .map(s => `${s.teamId}:${s.points}:${s.goalsFor}-${s.goalsAgainst}`)
      .join('|');
      
    return `${matchesKey}|${standingsKey}`;
  }, [game.matches, standings]);

  useEffect(() => {
    const generateInsights = async () => {
      const cacheKey = getCacheKey();
      
      // Try to get cached insights from localStorage
      const cached = localStorage.getItem(`gameInsights-${game.id}-${cacheKey}`);
      if (cached) {
        setError(null);
        setInsights(cached);
        return;
      }

      setError(null);
      setIsGenerating(true);
      try {
        // Prepare the prompt with game data
        const prompt = `Analyze this soccer game data and provide insights and forecasts:
        
        Game: ${game.name}
        Status: ${game.status}

        Standings:
        ${standings.map(s => {
          const team = game.teams?.find(t => t?.team.id === s.teamId);
          return `${team?.team.name}: Played ${s.played}, Won ${s.won}, Drawn ${s.drawn}, Lost ${s.lost}, GF ${s.goalsFor}, GA ${s.goalsAgainst}, Points ${s.points}`;
        }).join('\n')}

        Recent Matches:
        ${game.matches?.slice(-5).map(m => {
          const homeTeam = game.teams?.find(t => t?.team.id === m?.homeTeamId);
          const awayTeam = game.teams?.find(t => t?.team.id === m?.awayTeamId);
          return `${homeTeam?.team.name} ${m?.homeScore} - ${m?.awayScore} ${awayTeam?.team.name}`;
        }).join('\n')}

        Please provide:
        1. Key performance insights for each team
        2. Trends in recent matches
        3. Predictions for upcoming performance
        4. Recommendations for improvement`;

        const { data: summary, errors } = await client.generations
          .generateInsights({ requirement: prompt });

        if (errors) {
          throw new Error(errors.map(e => e.message).join(', '));
        }
        
        if (summary) {
          // Cache the insights in localStorage
          localStorage.setItem(`gameInsights-${game.id}-${cacheKey}`, summary.insights);
          setInsights(summary.insights);
        }
      } catch (error) {
        console.error('Error generating insights:', error);
        setError('Failed to generate insights. Please try again later.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateInsights();
  }, [game, standings, getCacheKey]);

  return (
    <Paper className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-gray-800 break-words text-wrap text-2xl font-medium">
              🎭 Football Comedy Hour - Match Stories with a Twist
            </h4>
            <p className="text-gray-600 flex items-center gap-1 text-sm">
              <AutoGraphIcon fontSize="small" />
              Powered by Amazon Bedrock
            </p>
          </div>
        </div>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isGenerating ? (
          <div className="flex justify-center p-4">
            <CircularProgress />
          </div>
        ) : insights ? (
          <Paper className="p-4 whitespace-pre-line">
            <p className="text-base">
              {insights}
            </p>
          </Paper>
        ) : (
          <Paper className="p-4 text-center">
            <p className="text-sm text-gray-500">
              Generating game insights and forecasts...
            </p>
          </Paper>
        )}
      </div>
    </Paper>
  );
};

export default GameInsights;

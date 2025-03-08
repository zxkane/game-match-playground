'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../../amplify/data/resource';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AvatarGroup,
} from '@mui/material';
import { UserProvider } from '@/context/UserContext';
import RequireAuth from '../../../components/RequireAuth';
import BreadcrumbsComponent from '../../../components/BreadcrumbsComponent';
import DraftsIcon from '@mui/icons-material/Drafts';
import PendingIcon from '@mui/icons-material/Pending';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UpdateIcon from '@mui/icons-material/Update';
import PublishIcon from '@mui/icons-material/Publish';
import DoneIcon from '@mui/icons-material/Done';
import { fetchAuthSession } from 'aws-amplify/auth';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Image from 'next/image';
import { getCurrentUser } from 'aws-amplify/auth';
import { stringToColor, stringAvatar } from '@/utils/avatar';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

// Import components
import GameHeader from './components/GameHeader';
import GameMetadata from './components/GameMetadata';
import TeamsSection from './components/TeamsSection';
import StandingsSection from './components/StandingsSection';
import MatchesSection from './components/MatchesSection';
import GameActions from './components/GameActions';
import AddTeamDialog from './components/dialogs/AddTeamDialog';
import AddMatchDialog from './components/dialogs/AddMatchDialog';

const client = generateClient<Schema>();

type GameStatus = 'active' | 'completed' | 'deleted';

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

type GameViewer = Schema['GameViewer']['type'];

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GameDetail({ params }: PageProps) {
  const resolvedParams = use(params) as { id: string };
  const router = useRouter();
  const [game, setGame] = useState<Schema['Game']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [openAddTeamDialog, setOpenAddTeamDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({ team: '', player: '' });
  const [leagues, setLeagues] = useState<Schema['LeagueCountry']['type'][]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [selectedLeagueDetails, setSelectedLeagueDetails] = useState<Schema['League']['type'] | null>(null);
  const [isLoadingLeagueDetails, setIsLoadingLeagueDetails] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [openAddMatchDialog, setOpenAddMatchDialog] = useState(false);
  const [newMatch, setNewMatch] = useState({
    homeTeamId: '',
    awayTeamId: '',
    homeScore: 0,
    awayScore: 0,
    date: '',
  });
  const [currentUser, setCurrentUser] = useState<{ username: string, userId: string } | null>(null);
  const [gameViewers, setGameViewers] = useState<GameViewer[]>([]);

  const updateGameStatus = async (gameId: string, status: GameStatus) => {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) throw new Error('User not signed in');

      const result = await client.mutations.updateGameStatus({
        id: gameId,
        newStatus: status
      }, {
        authMode: 'userPool',
        headers: {
          'Authorization': session.tokens.idToken.toString(),
        }
      });

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      if (!result.data) {
        throw new Error('No data returned from update operation');
      }

      setGame(result.data);
      return result.data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to update game status');
    }
  };

  const fetchGame = useCallback(async () => {
    try {
      setIsLoading(true);
      const gameResult = await client.models.Game.get({
        id: resolvedParams.id
      }, {
        selectionSet: ['id', 'name', 'owner', 'description', 'status', 'teams.*', 'matches.*', 'createdAt', 'updatedAt']
      });
      
      if (!gameResult.data) {
        setError('Game not found');
        return;
      }
      
      setGame({
        ...gameResult.data,
        teams: gameResult.data.teams as unknown as Schema['TeamPlayer']['type'][],
        matches: Array.isArray(gameResult.data.matches) ? gameResult.data.matches : []
      });
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Game not found');
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    if (resolvedParams.id) {
      fetchGame();

      // Subscribe to match additions
      const addSubscription = client.subscriptions.onMatchAdded({ gameId: resolvedParams.id }).subscribe({
        next: (data) => {
          if (data) {
            setGame(data);
          }
        },
        error: (error: Error) => console.error('Match add subscription error:', error)
      });

      // Subscribe to match deletions
      const deleteSubscription = client.subscriptions.onMatchDeleted({ gameId: resolvedParams.id }).subscribe({
        next: (data) => {
          if (data) {
            setGame(data);
          }
        },
        error: (error: Error) => console.error('Match delete subscription error:', error)
      });

      // Cleanup subscriptions
      return () => {
        addSubscription.unsubscribe();
        deleteSubscription.unsubscribe();
      };
    }
  }, [resolvedParams.id, fetchGame]);

  const handlePublishGame = async () => {
    try {
      const result = await updateGameStatus(resolvedParams.id, 'active');
      if (!result) {
        throw new Error('Failed to update game status');
      }
      setAlertMessage({ type: 'success', message: 'Game published successfully' });
    } catch (error) {
      console.error('Error publishing game:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to publish game: ${error.message}`
        : 'Failed to publish game: An unknown error occurred';
      setAlertMessage({ type: 'error', message: errorMessage });
    }
  };

  const handleCompleteGame = async () => {
    try {
      await updateGameStatus(resolvedParams.id, 'completed');
      setAlertMessage({ type: 'success', message: 'Game completed successfully' });
    } catch (error) {
      console.error('Error completing game:', error);
      setAlertMessage({ type: 'error', message: 'Failed to complete game' });
    }
  };

  const handleDeleteGame = async () => {
    try {
      await updateGameStatus(resolvedParams.id, 'deleted');
      setAlertMessage({ type: 'success', message: 'Game deleted successfully' });
      router.push('/games');
    } catch (error) {
      console.error('Error deleting game:', error);
      setAlertMessage({ type: 'error', message: 'Failed to delete game' });
    }
  };

  const fetchLeagues = async () => {
    try {
      setIsLoadingLeagues(true);
      const result = await client.queries.leagues({});
      if (result.data) {
        setLeagues(result.data.filter((league): league is Schema['LeagueCountry']['type'] => 
          league != null && league.league != null
        ));
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch leagues' });
    } finally {
      setIsLoadingLeagues(false);
    }
  };

  const handleAddTeamClick = async () => {
    setAlertMessage(null);
    await fetchLeagues();
    setOpenAddTeamDialog(true);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTeam = selectedLeagueDetails?.teams?.find(team => team?.name === newTeam.team);
      if (!selectedTeam) {
        setAlertMessage({ type: 'error', message: 'Please select a team' });
        return;
      }

      const result = await client.mutations.addTeamToGame({
        gameId: resolvedParams.id,
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        teamLogo: selectedTeam.logo || '',
        player: newTeam.player || null
      });

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      if (!result.data) {
        throw new Error('No data returned from add team operation');
      }

      setGame(result.data);
      setAlertMessage({ type: 'success', message: 'Team added successfully' });
      setOpenAddTeamDialog(false);
      setNewTeam({ team: '', player: '' });
      setSelectedLeague('');
      setSelectedLeagueDetails(null);
    } catch (error) {
      console.error('Error adding team:', error);
      setAlertMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add team' 
      });
    }
  };

  const fetchLeagueDetails = async (leagueId: string) => {
    try {
      setIsLoadingLeagueDetails(true);
      const result = await client.queries.league({ id: leagueId });
      if (result.data) {
        setSelectedLeagueDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch league details' });
    } finally {
      setIsLoadingLeagueDetails(false);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      const result = await client.mutations.removeTeamFromGame({
        gameId: resolvedParams.id,
        teamId: teamId
      });

      if (result.data) {
        setGame(result.data);
        setAlertMessage({ type: 'success', message: 'Team removed successfully' });
      }
    } catch (error) {
      console.error('Error removing team:', error);
      setAlertMessage({ type: 'error', message: 'Failed to remove team' });
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await client.mutations.addMatch({
        gameId: resolvedParams.id,
        ...newMatch,
        date: new Date().toISOString(),
      });

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      if (!result.data) {
        throw new Error('No data returned from add match operation');
      }

      setGame(result.data);
      setAlertMessage({ type: 'success', message: 'Match added successfully' });
      setOpenAddMatchDialog(false);
      setNewMatch({
        homeTeamId: '',
        awayTeamId: '',
        homeScore: 0,
        awayScore: 0,
        date: '',
      });
    } catch (error) {
      console.error('Error adding match:', error);
      setAlertMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add match' 
      });
    }
  };

  const getTeamById = (teams: Schema['TeamPlayer']['type'][], teamId: string): Schema['TeamPlayer']['type'] | undefined => {
    return teams.find(t => t.team?.id === teamId);
  };

  const calculateStandings = (matches: Schema['Match']['type'][], teams: Schema['TeamPlayer']['type'][]): Standing[] => {
    const standings = new Map<string, Standing>();
    
    // Initialize standings for all teams
    teams.forEach(team => {
      if (team?.team.id) {
        standings.set(team.team.id, {
          teamId: team.team.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      }
    });

    // Calculate standings from matches
    matches.forEach(match => {
      if (!match) return;

      const homeStanding = standings.get(match.homeTeamId);
      const awayStanding = standings.get(match.awayTeamId);

      if (homeStanding && awayStanding) {
        // Update matches played
        homeStanding.played++;
        awayStanding.played++;

        // Update goals
        homeStanding.goalsFor += match.homeScore;
        homeStanding.goalsAgainst += match.awayScore;
        awayStanding.goalsFor += match.awayScore;
        awayStanding.goalsAgainst += match.homeScore;

        // Update wins/draws/losses and points
        if (match.homeScore > match.awayScore) {
          homeStanding.won++;
          awayStanding.lost++;
          homeStanding.points += 3;
        } else if (match.homeScore < match.awayScore) {
          awayStanding.won++;
          homeStanding.lost++;
          awayStanding.points += 3;
        } else {
          homeStanding.drawn++;
          awayStanding.drawn++;
          homeStanding.points += 1;
          awayStanding.points += 1;
        }
      }
    });

    return Array.from(standings.values());
  };

  const handleDeleteMatch = async (matchIndex: number) => {
    try {
      const result = await client.mutations.deleteMatch({
        gameId: resolvedParams.id,
        matchIndex
      });

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      if (!result.data) {
        throw new Error('No data returned from delete operation');
      }

      setGame(result.data);
      setAlertMessage({ type: 'success', message: 'Match deleted successfully' });
    } catch (error) {
      console.error('Error deleting match:', error);
      setAlertMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete match' 
      });
    }
  };

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser({
          username: user.username,
          userId: user.userId
        });
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    if (!currentUser || !resolvedParams.id) return;

    // Subscribe to viewer updates
    const subscription = client.subscriptions.onGameViewersUpdated({ gameId: resolvedParams.id }).subscribe({
      next: (data) => {
        if (data) {
          // Filter out null/undefined values and inactive viewers
          const activeViewers = data
            .filter((viewer): viewer is Schema['GameViewer']['type'] => 
              viewer !== null && 
              viewer !== undefined && 
              new Date(viewer.lastSeen * 1000).getTime() > Date.now() - 60 * 1000
            );
          setGameViewers(activeViewers);
        }
      },
      error: (error) => console.error('Game viewers subscription error:', error)
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, resolvedParams.id]);

  useEffect(() => {
    if (!resolvedParams.id) return;

    // Add viewer record when component mounts
    const addViewer = async () => {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens?.idToken) {
          throw new Error('User not authenticated');
        }

        const result = await client.mutations.addGameViewer({
          gameId: resolvedParams.id,
        }, {
          authMode: 'userPool',
          headers: {
            'Authorization': session.tokens.idToken.toString(),
          }
        });

        if (result.errors) {
          throw new Error(result.errors.map(e => e.message).join(', '));
        }

        if (!result.data) {
          throw new Error('No data returned from viewer update');
        }

        const activeViewers = result.data
          .filter((viewer): viewer is Schema['GameViewer']['type'] => 
            viewer !== null && 
            viewer !== undefined && 
            new Date(viewer.lastSeen * 1000).getTime() > Date.now() - 60 * 1000
          );
        setGameViewers(activeViewers);
      } catch (error) {
        console.error('Error adding game viewer:', error);
        setAlertMessage({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Failed to add game viewer'
        });
      }
    };
    
    addViewer();

    // Set up interval to update lastSeen
    const interval = setInterval(addViewer, 30000);

    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  return (
    <RequireAuth>
      <UserProvider>
        <DashboardLayout>
          <main className="min-h-screen p-2 sm:p-8 w-full overflow-x-hidden box-border">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <CircularProgress />
                </div>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error} - The game you are looking for could not be found. It may have been deleted or you may have entered an incorrect URL.
                </Alert>
              ) : game ? (
                <>
                  <div className="flex justify-between items-center">
                    <BreadcrumbsComponent
                      links={[
                        { href: '/', label: 'Home' },
                        { href: '/games', label: 'Games' }
                      ]}
                      current={game.name}
                    />
                  </div>
                  {alertMessage && (
                    <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)}>
                      {alertMessage.message}
                    </Alert>
                  )}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Game Header */}
                    <GameHeader 
                      game={game}
                      onPublishGame={handlePublishGame}
                      onCompleteGame={handleCompleteGame}
                      onDeleteGame={handleDeleteGame}
                      alertMessage={alertMessage}
                      setAlertMessage={setAlertMessage}
                    />
                    
                    {/* Game Metadata */}
                    <Paper className="p-4">
                      <GameMetadata 
                        game={game}
                        gameViewers={gameViewers}
                      />
                    </Paper>
                    
                    {game.status === 'draft' ? (
                      /* Teams Section for Draft Mode */
                      <TeamsSection 
                        game={game}
                        onAddTeamClick={handleAddTeamClick}
                        onRemoveTeam={handleRemoveTeam}
                        isLoadingLeagues={isLoadingLeagues}
                      />
                    ) : (
                      <>
                        {/* Game Insights for Active Games */}
                        {game.status === 'active' && (
                          <GameInsights 
                            game={game} 
                            standings={calculateStandings(
                              game.matches?.filter((match): match is Schema['Match']['type'] => match !== null && match !== undefined) || [], 
                              game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => team !== null && team !== undefined) || []
                            )} 
                          />
                        )}
                        
                        {/* Standings Section */}
                        <StandingsSection 
                          game={game}
                          standings={calculateStandings(
                            game.matches?.filter((match): match is Schema['Match']['type'] => match !== null && match !== undefined) || [], 
                            game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => team !== null && team !== undefined) || []
                          )}
                          getTeamById={getTeamById}
                        />
                      </>
                    )}
                    
                    {/* Matches Section for Active or Completed Games */}
                    {(game.status === 'active' || game.status === 'completed') && (
                      <MatchesSection 
                        game={game}
                        onAddMatchClick={() => setOpenAddMatchDialog(true)}
                        onDeleteMatch={handleDeleteMatch}
                        getTeamById={getTeamById}
                      />
                    )}
                  </div>
                  
                  {/* Game Actions */}
                  <GameActions onBackToGames={() => router.push('/games')} />
                </>
              ) : null}
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>

      {/* Add Match Dialog */}
      <AddMatchDialog
        open={openAddMatchDialog}
        onClose={() => setOpenAddMatchDialog(false)}
        onAddMatch={handleAddMatch}
        newMatch={newMatch}
        setNewMatch={setNewMatch}
        game={game!}
        alertMessage={alertMessage}
        setAlertMessage={setAlertMessage}
      />

      {/* Add Team Dialog */}
      <AddTeamDialog
        open={openAddTeamDialog}
        onClose={() => setOpenAddTeamDialog(false)}
        onAddTeam={handleAddTeam}
        newTeam={newTeam}
        setNewTeam={setNewTeam}
        leagues={leagues}
        isLoadingLeagues={isLoadingLeagues}
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        selectedLeagueDetails={selectedLeagueDetails}
        isLoadingLeagueDetails={isLoadingLeagueDetails}
        alertMessage={alertMessage}
        setAlertMessage={setAlertMessage}
      />
    </RequireAuth>
  );
}

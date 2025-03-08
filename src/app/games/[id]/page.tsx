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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Image from 'next/image';
import { getCurrentUser } from 'aws-amplify/auth';
import AvatarGroup from '@mui/material/AvatarGroup';
import { stringToColor, stringAvatar } from '@/utils/avatar';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

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
            <Typography variant="h4" className="text-gray-800 break-words text-wrap" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
              🎭 Football Comedy Hour - Match Stories with a Twist
            </Typography>
            <Typography 
              variant="subtitle2" 
              className="text-gray-600 flex items-center gap-1"
            >
              <AutoGraphIcon fontSize="small" />
              Powered by Amazon Bedrock
            </Typography>
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
            <Typography variant="body1">
              {insights}
            </Typography>
          </Paper>
        ) : (
          <Paper className="p-4 text-center">
            <Typography variant="body2" color="text.secondary">
              Generating game insights and forecasts...
            </Typography>
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
                    <Paper className="p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 sm:justify-between">
                            <div className="flex items-center space-x-4">
                              <Typography variant="h4" component="h1" className="mr-4 break-words text-wrap" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                                {game.name}
                              </Typography>
                              <Chip
                              icon={
                                game.status === 'draft' ? <DraftsIcon /> 
                                : game.status === 'active' ? <PendingIcon />
                                : game.status === 'completed' ? <DoneAllIcon />
                                : game.status === 'deleted' ? <DeleteIcon />
                                : <DraftsIcon />  // fallback icon
                              }
                              label={game.status?.toUpperCase()}
                              color={
                                game.status === 'draft' ? 'default'
                                : game.status === 'active' ? 'primary'
                                : game.status === 'completed' ? 'success'
                                : game.status === 'deleted' ? 'error'
                                : 'default'
                              }
                              size="small"
                              variant="outlined"
                            />
                            </div>
                            <div className="hidden sm:flex sm:justify-end">
                              <ButtonGroup 
                                variant="contained" 
                                size="small"
                                sx={{ 
                                  '& .MuiButton-root': {
                                    width: '150px',
                                  }
                                }}
                              >
                                {game.status === 'draft' && (
                                  <Tooltip title={
                                    (!game.teams || Object.keys(game.teams).length < 2) 
                                      ? "At least two teams are required to publish" 
                                      : "Publish Game"
                                  }>
                                    <span>
                                      <Button
                                        onClick={handlePublishGame}
                                        startIcon={<PublishIcon />}
                                        color="primary"
                                        disabled={!game.teams || Object.keys(game.teams).length < 2}
                                      >
                                        Publish
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}
                                {game.status === 'active' && (
                                  <Tooltip title="Complete Game">
                                    <Button
                                      onClick={handleCompleteGame}
                                      startIcon={<DoneIcon />}
                                      color="success"
                                    >
                                      Complete
                                    </Button>
                                  </Tooltip>
                                )}
                                {game.status != 'deleted' && (
                                  <Tooltip title="Delete Game">
                                    <Button
                                      onClick={handleDeleteGame}
                                      startIcon={<DeleteIcon />}
                                      color="error"
                                    >
                                      Delete
                                    </Button>
                                  </Tooltip>
                                )}
                              </ButtonGroup>
                            </div>
                          </div>
                          <Typography variant="body1" className="text-gray-600 mt-4">
                            {game.description}
                          </Typography>
                          <div className="space-y-2 mt-4">
                            <Typography variant="body2" className="flex items-center gap-2">
                              <AddCircleOutlineIcon fontSize="small" />
                              {new Date(game.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" className="flex items-center gap-2">
                              <UpdateIcon fontSize="small" />
                              {new Date(game.updatedAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Owner:</strong> {game.owner}
                            </Typography>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                              <AvatarGroup max={6}>
                                {gameViewers.map((viewer) => (
                                  <Tooltip 
                                    key={viewer.userId} 
                                    title={viewer.username}
                                    placement="top"
                                  >
                                    <Avatar
                                      {...stringAvatar(viewer.username)}
                                      sx={{ 
                                        width: 32, 
                                        height: 32,
                                        bgcolor: stringToColor(viewer.username)
                                      }}
                                    />
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                              {gameViewers.length > 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', display: 'inline' }}>
                                  {gameViewers.length == 1 ? 'is viewing this game.' : 'are viewing this game.'}
                                </Typography>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 sm:hidden flex justify-center">
                            <ButtonGroup 
                              size="small"
                              sx={{ 
                                width: '100%',
                                '& .MuiButton-root': {
                                  width: '150px',
                                }
                              }}
                            >
                              {game.status === 'draft' && (
                                <Tooltip title={
                                  (!game.teams || Object.keys(game.teams).length < 2) 
                                    ? "At least two teams are required to publish" 
                                    : "Publish Game"
                                }>
                                  <span style={{ width: '100%' }}>
                                    <Button
                                      onClick={handlePublishGame}
                                      startIcon={<PublishIcon />}
                                      color="primary"
                                      disabled={!game.teams || Object.keys(game.teams).length < 2}
                                      fullWidth
                                    >
                                      Publish
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                              {game.status === 'active' && (
                                <Tooltip title="Complete Game">
                                  <Button
                                    onClick={handleCompleteGame}
                                    startIcon={<DoneIcon />}
                                    color="success"
                                  >
                                    Complete
                                  </Button>
                                </Tooltip>
                              )}
                              {game.status != 'deleted' && (
                                <Tooltip title="Delete Game">
                                  <Button
                                    onClick={handleDeleteGame}
                                    startIcon={<DeleteIcon />}
                                    color="error"
                                  >
                                    Delete
                                  </Button>
                                </Tooltip>
                              )}
                            </ButtonGroup>
                          </div>
                        </div>
                      </div>
                    </Paper>
                    
                    {game.status === 'draft' ? (
                      <Paper className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Typography variant="h4" className="text-gray-800">
                              Teams
                            </Typography>
                            {game.status === 'draft' && (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddTeamClick}
                                startIcon={isLoadingLeagues ? <CircularProgress size={20} /> : <AddIcon />}
                                disabled={isLoadingLeagues}
                              >
                                {isLoadingLeagues ? 'Loading...' : 'Add New Team'}
                              </Button>
                            )}
                          </div>
                          {game.teams && Object.keys(game.teams).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-4">
                              {Object.values(game.teams).map((teamPlayer) => 
                                teamPlayer && teamPlayer.team && (
                                  <Paper 
                                    key={teamPlayer.team.id} 
                                    className="p-1 sm:p-4 flex flex-col items-center text-center relative"
                                    elevation={1}
                                  >
                                    {game.status === 'draft' && (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveTeam(teamPlayer.team!.id)}
                                        sx={{ 
                                          position: 'absolute',
                                          right: 4,
                                          top: 4,
                                          opacity: 0.7,
                                          '&:hover': {
                                            opacity: 1
                                          }
                                        }}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    {teamPlayer.team.logo && (
                                      <Avatar
                                        src={teamPlayer.team.logo}
                                        alt={teamPlayer.team.name}
                                        sx={{ 
                                          width: { xs: 40, sm: 64 }, 
                                          height: { xs: 40, sm: 64 },
                                          mb: { xs: 0.5, sm: 1 }
                                        }}
                                        variant="rounded"
                                      >
                                          {teamPlayer.team.name?.charAt(0)}
                                        </Avatar>
                                    )}
                                    <Typography 
                                      variant="subtitle2" 
                                      sx={{ 
                                        fontWeight: 'bold',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      {teamPlayer.team.name}
                                    </Typography>
                                    {teamPlayer.player && (
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{
                                          width: '100%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          fontSize: { xs: '0.625rem', sm: '0.75rem' }
                                        }}
                                      >
                                        {teamPlayer.player}
                                      </Typography>
                                    )}
                                  </Paper>
                                )
                              )}
                            </div>
                          ) : (
                            <Paper className="p-4 sm:p-6 text-center w-full">
                              <Typography variant="body2" className="text-gray-600">
                                No teams available.
                              </Typography>
                            </Paper>
                          )}
                        </div>
                      </Paper>
                    ) : (
                      <>
                        {game.status === 'active' && (
                          <GameInsights 
                            game={game} 
                            standings={calculateStandings(
                              game.matches?.filter((match): match is Schema['Match']['type'] => match !== null && match !== undefined) || [], 
                              game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => team !== null && team !== undefined) || []
                            )} 
                          />
                        )}
                        <Paper className="p-4">
                          <div className="space-y-4">
                            <Typography variant="h4" className="text-gray-800 mb-4">
                              Standings
                            </Typography>
                            {game.teams && game.teams.length > 0 ? (
              <TableContainer className="overflow-x-auto">
                <Table size="small" className="w-full">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell className="px-2">Team</TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Played</span>
                                        <span className="sm:hidden">P</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Won</span>
                                        <span className="sm:hidden">W</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Drawn</span>
                                        <span className="sm:hidden">D</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Lost</span>
                                        <span className="sm:hidden">L</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Goals For</span>
                                        <span className="sm:hidden">GF</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Goals Against</span>
                                        <span className="sm:hidden">GA</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Goal Diff</span>
                                        <span className="sm:hidden">GD</span>
                                      </TableCell>
                                      <TableCell align="center" className="px-1">
                                        <span className="hidden sm:inline">Points</span>
                                        <span className="sm:hidden">Pts</span>
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {calculateStandings(game.matches?.filter((match): match is Schema['Match']['type'] => match !== null && match !== undefined) || [], game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => team !== null && team !== undefined) || [])
                                      .sort((a, b) => 
                                        b.points - a.points || // Sort by points
                                        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || // Then by goal difference
                                        b.goalsFor - a.goalsFor // Then by goals scored
                                      )
                                      .map((standing) => {
                                        const team = getTeamById(game.teams?.filter((team): team is Schema['TeamPlayer']['type'] => team !== null && team !== undefined) || [], standing.teamId);
                                        if (!team) return null;

                                        return (
                                          <TableRow key={standing.teamId}>
                                            <TableCell className="px-2">
                                              <div className="flex items-center gap-1">
                                                <Avatar
                                                  src={team.team.logo || ''}
                                                  alt={team.team.name}
                                                  sx={{ width: { xs: 16, sm: 24 }, height: { xs: 16, sm: 24 } }}
                                                  variant="rounded"
                                                />
                                                <span className="truncate max-w-[80px] sm:max-w-none">
                                                  {team.team.name}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell align="center" className="px-1">{standing.played}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.won}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.drawn}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.lost}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.goalsFor}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.goalsAgainst}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.goalsFor - standing.goalsAgainst}</TableCell>
                                            <TableCell align="center" className="px-1">{standing.points}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Paper className="p-4 sm:p-6 text-center w-full">
                                <Typography variant="body2" className="text-gray-600">
                                  No teams available.
                                </Typography>
                              </Paper>
                            )}
                          </div>
                        </Paper>
                      </>
                    )}
                    {game.status === 'active' || game.status === 'completed' ? (
                      <Paper className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Typography variant="h4" className="text-gray-800">
                              Matches
                            </Typography>
                            {game.status === 'active' && (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setOpenAddMatchDialog(true)}
                                startIcon={<AddIcon />}
                              >
                                Add Match
                              </Button>
                            )}
                          </div>

                          {game.matches && game.matches.length > 0 ? (
                            <TableContainer className="overflow-x-auto">
                              <Table className="w-full">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Home Team</TableCell>
                                    <TableCell align="center">Score</TableCell>
                                    <TableCell align="left">Away Team</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {game.matches
                                    .filter((match): match is Schema['Match']['type'] => match !== null)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((match, index) => {
                                      const homeTeam = getTeamById(game.teams?.filter((t): t is Schema['TeamPlayer']['type'] => t !== null && t !== undefined) || [], match.homeTeamId);
                                      const awayTeam = getTeamById(game.teams?.filter((t): t is Schema['TeamPlayer']['type'] => t !== null && t !== undefined) || [], match.awayTeamId);
                                      
                                      if (!homeTeam || !awayTeam) return null;

                                      return (
                                        <TableRow key={`${match.homeTeamId}-${match.awayTeamId}-${match.date}`}>
                                          <TableCell>
                                            {new Date(match.date).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell align="right">
                                            <div className="flex items-center justify-end gap-2">
                                              <span className="break-words text-wrap max-w-[100px] sm:max-w-none">{homeTeam.team.name}</span>
                                              <Avatar
                                                src={homeTeam.team.logo || ''}
                                                alt={homeTeam.team.name}
                                                sx={{ width: 24, height: 24 }}
                                                variant="rounded"
                                              />
                                            </div>
                                          </TableCell>
                                          <TableCell align="center">
                                            {match.homeScore} - {match.awayScore}
                                          </TableCell>
                                          <TableCell align="left">
                                            <div className="flex items-center gap-2">
                                              <Avatar
                                                src={awayTeam.team.logo || ''}
                                                alt={awayTeam.team.name}
                                                sx={{ width: 24, height: 24 }}
                                                variant="rounded"
                                              />
                                              <span className="break-words text-wrap max-w-[100px] sm:max-w-none">{awayTeam.team.name}</span>
                                            </div>
                                          </TableCell>
                                          {game.status === 'active' && (
                                            <TableCell align="right" padding="none">
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteMatch(index)}
                                                sx={{ 
                                                  opacity: 0.7,
                                                  '&:hover': {
                                                    opacity: 1
                                                  }
                                                }}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      );
                                    })
                                    .filter(Boolean)}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Paper className="p-4 sm:p-6 text-center w-full">
                              <Typography variant="body2" className="text-gray-600">
                                No matches available.
                              </Typography>
                            </Paper>
                          )}
                        </div>
                      </Paper>
                    ) : null}
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outlined"
                      onClick={() => router.push('/games')}
                    >
                      Back to Games
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>

      {/* Add Match Dialog */}
      <Dialog 
        open={openAddMatchDialog} 
        onClose={() => setOpenAddMatchDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Match</DialogTitle>
        <DialogContent>
          {alertMessage && (
            <Alert 
              severity={alertMessage.type} 
              onClose={() => setAlertMessage(null)}
              sx={{ mb: 2 }}
            >
              {alertMessage.message}
            </Alert>
          )}
          <form onSubmit={handleAddMatch} className="space-y-4 pt-2">
            <TextField
              select
              fullWidth
              label="Home Team"
              value={newMatch.homeTeamId}
              onChange={(e) => setNewMatch({...newMatch, homeTeamId: e.target.value})}
              required
            >
              {game?.teams?.filter(team => team !== null).map((teamPlayer) => (
                <MenuItem 
                  key={teamPlayer?.team.id} 
                  value={teamPlayer?.team.id}
                  disabled={teamPlayer?.team.id === newMatch.awayTeamId}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={teamPlayer?.team.logo || ''}
                      alt={teamPlayer?.team.name}
                      sx={{ width: 24, height: 24 }}
                      variant="rounded"
                    />
                    <span className="break-words text-wrap">{teamPlayer?.team.name}</span>
                  </div>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Away Team"
              value={newMatch.awayTeamId}
              onChange={(e) => setNewMatch({...newMatch, awayTeamId: e.target.value})}
              required
            >
              {game?.teams?.filter(team => team !== null).map((teamPlayer) => (
                <MenuItem 
                  key={teamPlayer?.team.id} 
                  value={teamPlayer?.team.id}
                  disabled={teamPlayer?.team.id === newMatch.homeTeamId}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={teamPlayer?.team.logo || ''}
                      alt={teamPlayer?.team.name}
                      sx={{ width: 24, height: 24 }}
                      variant="rounded"
                    />
                    <span className="break-words text-wrap">{teamPlayer?.team.name}</span>
                  </div>
                </MenuItem>
              ))}
            </TextField>

            <div className="flex gap-4">
              <TextField
                type="number"
                label="Home Score"
                value={newMatch.homeScore}
                onChange={(e) => setNewMatch({...newMatch, homeScore: parseInt(e.target.value) || 0})}
                required
                inputProps={{ min: 0 }}
              />
              <TextField
                type="number"
                label="Away Score"
                value={newMatch.awayScore}
                onChange={(e) => setNewMatch({...newMatch, awayScore: parseInt(e.target.value) || 0})}
                required
                inputProps={{ min: 0 }}
              />
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddMatchDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMatch} variant="contained">
            Add Match
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Team Dialog */}
      <Dialog 
        open={openAddTeamDialog} 
        onClose={() => setOpenAddTeamDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Team</DialogTitle>
        <DialogContent>
          {alertMessage && (
            <Alert 
              severity={alertMessage.type} 
              onClose={() => setAlertMessage(null)}
              sx={{ mb: 2 }}
            >
              {alertMessage.message}
            </Alert>
          )}
          {isLoadingLeagues ? (
            <CircularProgress />
          ) : (
            <form onSubmit={handleAddTeam} className="space-y-4 pt-2">
              <TextField
                select
                fullWidth
                label="Select League"
                value={selectedLeague}
                onChange={(e) => {
                  setSelectedLeague(e.target.value);
                  setNewTeam({...newTeam, team: ''});
                  const selectedLeague = leagues.find(l => l.league?.name === e.target.value);
                  if (selectedLeague?.league?.id) {
                    fetchLeagueDetails(selectedLeague.league.id.toString());
                  }
                }}
                required
                sx={{ 
                  mb: 2,
                  width: '100%',
                  maxWidth: '400px',
                  '& .MuiSelect-select': {
                    width: '100%'
                  }
                }}
                slotProps={{
                  select: {
                    style: {
                      maxHeight: 300,
                      width: 'auto',
                    }
                  }
                }}
              >
                {leagues.map((league) => (
                  <MenuItem 
                    key={league.league?.id} 
                    value={league.league?.name}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      width: 'auto',
                      minWidth: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      {league.country?.flag && (
                        <Image
                          src={league.country.flag}
                          alt={`${league.country?.name} flag`}
                          width={24}
                          height={16}
                          loading="lazy"
                          style={{ objectFit: 'contain', flexShrink: 0 }}
                        />
                      )}
                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{league.country?.name} - </span>
                      {league.league?.logo && (
                        <Image
                          src={league.league.logo}
                          alt={`${league.league?.name} logo`}
                          width={20}
                          height={20}
                          loading="lazy"
                          style={{ objectFit: 'contain', flexShrink: 0 }}
                        />
                      )}
                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{league.league?.name}</span>
                    </div>
                  </MenuItem>
                ))}
              </TextField>

              {isLoadingLeagueDetails ? (
                <div className="flex justify-center p-4">
                  <CircularProgress size={24} />
                </div>
              ) : selectedLeagueDetails?.teams ? (
                <TextField
                  select
                  fullWidth
                  label="Select Team"
                  value={newTeam.team}
                  onChange={(e) => setNewTeam({...newTeam, team: e.target.value})}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 'auto',
                        }
                      }
                    }
                  }}
                >
                  {selectedLeagueDetails.teams.map((team) => 
                    team && (
                      <MenuItem 
                        key={team.id} 
                        value={team.name}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                          {team.logo && (
                            <Image
                              src={team.logo}
                              alt={`${team.name} logo`}
                              width={20}
                              height={20}
                              loading="lazy"
                              style={{ objectFit: 'contain', flexShrink: 0 }}
                            />
                          )}
                          <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {team.name}
                          </span>
                        </div>
                      </MenuItem>
                    )
                  )}
                </TextField>
              ) : null}

              <TextField
                fullWidth
                label="Player Name"
                value={newTeam.player}
                onChange={(e) => setNewTeam({...newTeam, player: e.target.value})}
              />
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddTeamDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTeam} variant="contained" disabled={isLoadingLeagues}>
            Add Team
          </Button>
        </DialogActions>
      </Dialog>
    </RequireAuth>
  );
}

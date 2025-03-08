'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../../amplify/data/resource';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { UserProvider } from '@/context/UserContext';
import RequireAuth from '../../../components/RequireAuth';
import BreadcrumbsComponent from '../../../components/BreadcrumbsComponent';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getCurrentUser } from 'aws-amplify/auth';

// Import components
import GameHeader from './components/GameHeader';
import GameMetadata from './components/GameMetadata';
import TeamsSection from './components/TeamsSection';
import StandingsSection from './components/StandingsSection';
import MatchesSection from './components/MatchesSection';
import GameActions from './components/GameActions';
import GameInsights from './components/GameInsights';
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
      if (!game || !game.matches) {
        throw new Error('Game or matches not available');
      }

      // Get valid matches and sort them like in the UI (newest first)
      const validMatches = game.matches
        .filter((match): match is Schema['Match']['type'] => match !== null && match !== undefined)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (matchIndex >= validMatches.length) {
        throw new Error('Invalid match index');
      }

      // Get the match we want to delete by its sorted index
      const matchToDelete = validMatches[matchIndex];
      
      // Find its actual index in the original array
      const actualIndex = game.matches.findIndex(
        m => m && m.homeTeamId === matchToDelete.homeTeamId && 
        m.awayTeamId === matchToDelete.awayTeamId && 
        m.date === matchToDelete.date
      );

      if (actualIndex === -1) {
        throw new Error('Match not found in original array');
      }
      
      const result = await client.mutations.deleteMatch({
        gameId: resolvedParams.id,
        matchIndex: actualIndex
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
                    <Paper className="p-4 py-8">
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

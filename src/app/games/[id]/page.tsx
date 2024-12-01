'use client';

import { useState, useEffect } from 'react';
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
import Image from 'next/image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const client = generateClient<Schema>();

type GameStatus = 'active' | 'completed' | 'deleted';

export default function GameDetail({ params }: { params: { id: string } }) {
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

  const fetchGame = async () => {
    try {
      setIsLoading(true);
      const gameResult = await client.models.Game.get({
        id: params.id
      }, {
        selectionSet: ['id', 'name', 'owner', 'description', 'status', 'teams.*', 'createdAt', 'updatedAt']
      });
      
      if (!gameResult.data) {
        setError('Game not found');
        return;
      }
      
      setGame({
        ...gameResult.data,
        teams: gameResult.data.teams as unknown as Schema['TeamPlayer']['type'][]
      });
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Game not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchGame();
    }
  }, [params.id]);

  const handlePublishGame = async () => {
    try {
      const result = await updateGameStatus(params.id, 'active');
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
      await updateGameStatus(params.id, 'completed');
      setAlertMessage({ type: 'success', message: 'Game completed successfully' });
    } catch (error) {
      console.error('Error completing game:', error);
      setAlertMessage({ type: 'error', message: 'Failed to complete game' });
    }
  };

  const handleDeleteGame = async () => {
    try {
      await updateGameStatus(params.id, 'deleted');
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
        gameId: params.id,
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
        gameId: params.id,
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

  return (
    <RequireAuth>
      <UserProvider>
        <DashboardLayout>
          <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <CircularProgress />
                </div>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error} - The game you are looking for could not be found. It may have been deleted or you may have entered an incorrect URL.
                </Alert>
              ) : game ? (
                <>
                  <BreadcrumbsComponent
                    links={[
                      { href: '/', label: 'Home' },
                      { href: '/games', label: 'Games' }
                    ]}
                    current={game.name}
                  />
                  {alertMessage && (
                    <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)}>
                      {alertMessage.message}
                    </Alert>
                  )}
                <Paper className="p-6 space-y-4">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <Typography variant="h4" component="h1" className="mr-4">
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
                      <ButtonGroup variant="contained" size="small">
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
                  <Typography variant="body1" className="text-gray-600">
                    {game.description}
                  </Typography>
                  <div className="space-y-2">
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
                  </Paper>
                  <Paper className="mt-4">
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
                        <Dialog 
                          open={openAddTeamDialog} 
                          onClose={() => setOpenAddTeamDialog(false)}
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
                                    minWidth: '400px',
                                    '& .MuiSelect-select': {
                                      width: '400px'
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
                                        <span style={{ whiteSpace: 'nowrap' }}>{league.country?.name} - </span>
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
                                        <span style={{ whiteSpace: 'nowrap' }}>{league.league?.name}</span>
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
                                    {selectedLeagueDetails.teams.map((team: any) => (
                                      team && (
                                        <MenuItem 
                                          key={team.id} 
                                        value={team.name}
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: 1,
                                          width: 'auto',
                                          minWidth: '100%'
                                        }}
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
                                          <span style={{ whiteSpace: 'nowrap' }}>
                                            {team.name}
                                          </span>
                                          </div>
                                      </MenuItem>
                                    )
                                    ))}
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
                      </div>
                      {game.teams && Object.keys(game.teams).length > 0 ? (
                        <div className="grid grid-cols-4 gap-1 sm:gap-4">
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
                        <Paper className="p-6 text-center">
                          <Typography variant="body2" className="text-gray-600">
                            No teams available.
                          </Typography>
                        </Paper>
                      )}
                    </div>
                  </Paper>
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
    </RequireAuth>
  );
} 
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

const client = generateClient<Schema>();

type GameStatus = 'active' | 'completed' | 'deleted';

export default function GameDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [game, setGame] = useState<Schema['Game']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
      if (result.data) {
        setGame(result.data);
        return result.data;
      }
    } catch (error) {
      throw new Error(`Failed to update game status: ${error}`);
    }
  };

  const fetchGame = async () => {
    try {
      setIsLoading(true);
      const gameResult = await client.models.Game.get({
        id: params.id
      }, {
        selectionSet: ['id', 'name', 'owner', 'description', 'status', 'createdAt', 'updatedAt']
      });
      
      if (!gameResult.data) {
        setError('Game not found');
        return;
      }
      
      setGame(gameResult.data);
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
      await updateGameStatus(params.id, 'active');
      setAlertMessage({ type: 'success', message: 'Game published successfully' });
    } catch (error) {
      console.error('Error publishing game:', error);
      setAlertMessage({ type: 'error', message: 'Failed to publish game' });
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
                          <Tooltip title="Publish Game">
                            <Button
                              onClick={handlePublishGame}
                              startIcon={<PublishIcon />}
                              color="primary"
                            >
                              Publish
                            </Button>
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
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outlined"
                      onClick={() => router.push('/games')}
                    >
                        Back to Games
                      </Button>
                    </div>
                  </Paper>
                </>
              ) : null}
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>
    </RequireAuth>
  );
} 
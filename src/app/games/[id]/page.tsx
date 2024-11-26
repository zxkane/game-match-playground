'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../../amplify/data/resource';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Typography,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  CircularProgress,
} from '@mui/material';
import { UserProvider } from '@/context/UserContext';

const client = generateClient<Schema>();

export default function GameDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [game, setGame] = useState<Schema['Game']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setIsLoading(true);
        const gameResult = await client.models.Game.get({
          id: params.id
        }, {
          selectionSet: ['id', 'name', 'owner', 'description', 'status', 'createdAt', 'updatedAt']
        });
        
        if (!gameResult.data) {
          throw new Error('Game not found');
        }
        
        setGame(gameResult.data);
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game details');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchGame();
    }
  }, [params.id]);

  return (
    <UserProvider>
      <DashboardLayout>
        <main className="min-h-screen p-8">
          <Authenticator>
            {({ }) => (
              <div className="max-w-4xl mx-auto space-y-6">
                <Breadcrumbs aria-label="breadcrumb">
                  <MuiLink underline="hover" color="inherit" href="/">
                    Home
                  </MuiLink>
                  <MuiLink underline="hover" color="inherit" href="/games">
                    Games
                  </MuiLink>
                  <Typography sx={{ color: 'text.primary' }}>
                    {isLoading ? 'Loading...' : game?.name || 'Game Details'}
                  </Typography>
                </Breadcrumbs>

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <CircularProgress />
                  </div>
                ) : error ? (
                  <Paper className="p-6">
                    <Typography color="error">{error}</Typography>
                    <Button
                      variant="contained"
                      onClick={() => router.push('/games')}
                      sx={{ mt: 2 }}
                    >
                      Back to Games
                    </Button>
                  </Paper>
                ) : game ? (
                  <Paper className="p-6 space-y-4">
                    <Typography variant="h4" component="h1">
                      {game.name}
                    </Typography>
                    <Typography variant="body1" className="text-gray-600">
                      {game.description}
                    </Typography>
                    <div className="space-y-2">
                      <Typography variant="body2">
                        <strong>Status:</strong> {game.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Created:</strong> {new Date(game.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last Updated:</strong> {new Date(game.updatedAt).toLocaleString()}
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
                ) : null}
              </div>
            )}
          </Authenticator>
        </main>
      </DashboardLayout>
    </UserProvider>
  );
} 
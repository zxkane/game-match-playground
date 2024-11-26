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
} from '@mui/material';
import { UserProvider } from '@/context/UserContext';
import RequireAuth from '../../../components/RequireAuth';
import BreadcrumbsComponent from '../../../components/BreadcrumbsComponent';

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

    if (params.id) {
      fetchGame();
    }
  }, [params.id]);

  return (
    <RequireAuth>
      <UserProvider>
        <DashboardLayout>
          <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {game && (
                <BreadcrumbsComponent
                  links={[
                    { href: '/', label: 'Home' },
                    { href: '/', label: 'Games' }
                  ]}
                  current={game.name}
                />
              )}

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <CircularProgress />
                </div>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error} - The game you are looking for could not be found. It may have been deleted or you may have entered an incorrect URL.
                </Alert>
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
                      onClick={() => router.push('/')}
                    >
                      Back to Games
                    </Button>
                  </div>
                </Paper>
              ) : null}
            </div>
          </main>
        </DashboardLayout>
      </UserProvider>
    </RequireAuth>
  );
} 
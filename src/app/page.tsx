'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import DashboardLayout from '../components/DashboardLayout';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import { Breadcrumbs, Link as MuiLink, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { UserProvider, useUser } from '../context/UserContext';

const client = generateClient<Schema>({
  authMode: 'userPool',
});

function SignInHeader() {
  return (
    <div className="flex flex-col items-center mb-4">
      <h3 className="text-xl font-semibold">Sign in to Game Match App</h3>
      <p className="text-sm text-gray-600">Use your email or Google account</p>
    </div>
  );
}

export default function Home() {
  
  return (
    <UserProvider>
      <HomeContent />
    </UserProvider>
  );
}

function HomeContent() {
  const router = useRouter();
  const { userEmail } = useUser();
  const [games, setGames] = useState<Schema['Game']['type'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async (userId: string) => {
      try {
        setIsLoading(true);
        const gamesResult = await client.models.Game.list({
          selectionSet: ['id', 'name', 'owner', 'description', 'status', 'updatedAt']
        });
        setGames(gamesResult.data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail) {
      fetchGames(userEmail);
    }
  }, [userEmail]);

  return (
    <DashboardLayout>
      <main className="min-h-screen p-8">
        <Authenticator
          components={{
            Header: SignInHeader
          }}
          loginMechanisms={['email']}
          signUpAttributes={['email']}
          initialState="signIn"
          socialProviders={['google']}
        >
          {({ }) => (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Breadcrumbs aria-label="breadcrumb">
                  <MuiLink underline="hover" color="inherit" href="/">
                    Home
                  </MuiLink>
                  <MuiLink
                    underline="hover"
                    color="inherit"
                    href="/games"
                  >
                    Games
                  </MuiLink>
                  <Typography sx={{ color: 'text.primary' }}>Your Games</Typography>
                </Breadcrumbs>
                {games.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/games/new')}
                  >
                    Create New Game
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-2 text-center p-8">
                    <Typography variant="body1" color="text.secondary">
                      Loading games...
                    </Typography>
                  </div>
                ) : games.length === 0 ? (
                  <div className="col-span-2 text-center p-8 border rounded-lg bg-gray-50">
                    <Typography variant="body1" color="text.secondary">
                      No games found. Create a new game to get started.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => router.push('/games/new')}
                      sx={{ mt: 2 }}
                    >
                      Create New Game
                    </Button>
                  </div>
                ) : (
                  games.map((game) => (
                    <div 
                      key={game.id} 
                      className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/games/${game.id}`)}
                    >
                      <h3 className="font-semibold">{game.name}</h3>
                      <p className="text-gray-600">{game.description}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Status: {game.status}</p>
                        <p>Created: {new Date(game.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Authenticator>
      </main>
    </DashboardLayout>
  );
}

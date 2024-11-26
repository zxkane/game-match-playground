'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../../amplify/data/resource';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  TextField,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Typography
} from '@mui/material';
import { UserProvider } from '@/context/UserContext';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export default function NewGame() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) throw new Error('User not signed in');
      
      const newGame = await client.mutations.customCreateGame({
        ...formData,
      }, {
        authMode: 'userPool',
        headers: {
          'Authorization': session.tokens.idToken.toString(),
        }
      });

      router.push(`/games/${newGame?.data?.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserProvider>
      <DashboardLayout>
        <main className="min-h-screen p-8">
          <Authenticator>
            {({ }) => (
              <div className="max-w-2xl mx-auto space-y-6">
                <Breadcrumbs aria-label="breadcrumb">
                  <MuiLink underline="hover" color="inherit" href="/">
                    Home
                  </MuiLink>
                  <MuiLink underline="hover" color="inherit" href="/games">
                    Games
                  </MuiLink>
                  <Typography sx={{ color: 'text.primary' }}>New Game</Typography>
                </Breadcrumbs>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <TextField
                    fullWidth
                    label="Game Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outlined"
                      onClick={() => router.push('/')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      Create Game
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </Authenticator>
        </main>
      </DashboardLayout>
    </UserProvider>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../../amplify/data/resource';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  TextField,
  Button} from '@mui/material';
import { UserProvider } from '@/context/UserContext';
import BreadcrumbsComponent from '../../../components/BreadcrumbsComponent';
import RequireAuth from '../../../components/RequireAuth';
import { useSession } from 'next-auth/react';

const client = generateClient<Schema>({
  authMode: 'lambda',
  headers: async () => {
    const session = await fetch('/api/auth/session').then(res => res.json());
    return {
      Authorization: `Bearer ${session?.idToken}`
    };
  }
});

export default function NewGame() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!session) throw new Error('User not signed in');
      
      const newGame = await client.mutations.customCreateGame({
        ...formData,
      });

      router.push(`/games/${newGame?.data?.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireAuth>
      <UserProvider>
        <DashboardLayout>
          <main className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <BreadcrumbsComponent
                links={[
                  { href: '/', label: 'Home' },
                  { href: '/games', label: 'Games' }
                ]}
                current="New Game"
              />

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
          </main>
        </DashboardLayout>
      </UserProvider>
    </RequireAuth>
  );
} 
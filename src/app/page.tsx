'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SITE_TITLE } from '../constant';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

function SignInHeader() {
  return (
    <div className="flex flex-col items-center justify-center"
         style={{ padding: '1.5rem 1rem 1rem' }}>
      <h3 className="text-xl font-semibold mb-1">
        Sign in to {SITE_TITLE}
      </h3>
      <p className="text-sm text-gray-600">
        Sign in with your OIDC account
      </p>
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/games');
    }
  }, [session, router]);

  // Show loading state while checking session
  if (status === 'loading' || session) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: '100vh', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Only show login if not authenticated
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      <Box sx={{ 
        maxWidth: 400, 
        width: '100%',
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: 'background.paper',
        margin: 'auto'
      }}>
        <SignInHeader />
        <Button
          variant="contained"
          onClick={() => signIn('oidc')}
          color="primary"
          fullWidth
        >
          Sign In with OIDC
        </Button>
      </Box>
    </div>
  );
}

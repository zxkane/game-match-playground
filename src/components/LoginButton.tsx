'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@mui/material';

export function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Button
        variant="contained"
        onClick={() => signOut()}
        color="primary"
      >
        Sign Out
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      onClick={() => signIn('oidc')}
      color="primary"
    >
      Sign In
    </Button>
  );
} 
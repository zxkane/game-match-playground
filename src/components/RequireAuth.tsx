import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const router = useRouter();
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);

  useEffect(() => {
    // Redirect to home page if not authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/');
    }
    
    // Also redirect if authenticated but no user data
    if (authStatus === 'authenticated' && !user) {
      router.push('/');
    }
  }, [user, router, authStatus]);

  // Show loading state while determining auth status
  if (authStatus === 'configuring') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Checking authentication...</Typography>
      </Box>
    );
  }

  // Don't render children if not authenticated
  if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && !user)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Redirecting to login...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;

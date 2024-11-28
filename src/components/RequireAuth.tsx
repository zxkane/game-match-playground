import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const router = useRouter();
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated' && !user) {
      router.push('/');
    }
  }, [user, router, authStatus]);

  // Wait for auth status to be determined
  if (authStatus === 'configuring' || authStatus === 'unauthenticated') {
    return null; // Or return a loading spinner
  }

  // Only check user after auth status is determined
  if (authStatus === 'authenticated' && !user) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth; 
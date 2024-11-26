import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null; // Optionally, you can return a loading spinner or a placeholder
  }

  return <>{children}</>;
};

export default RequireAuth; 
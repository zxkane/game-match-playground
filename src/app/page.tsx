'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isGoogleAuthEnabled } from '../constant';
import { fetchUserAttributes } from 'aws-amplify/auth';

function SignInHeader() {
  return (
    <div className="flex flex-col items-center justify-center"
         style={{ 
           padding: '1.5rem 1rem 1rem'
         }}>
      <h3 className="text-xl font-semibold mb-1"
          style={{ color: 'var(--amplify-colors-font-primary)' }}>
        Sign in to Game Match App
      </h3>
      <p className="text-sm"
         style={{ color: 'var(--amplify-colors-font-secondary)' }}>
        {isGoogleAuthEnabled ? 'Use your email or Google account' : 'Use your email to sign in'}
      </p>
    </div>
  );
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email || '');
      } catch (error) {
        console.debug('Error fetching user attributes:', error);
      }
    };
    getUserEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      router.push('/games');
    }
  }, [userEmail, router]);

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Authenticator
          components={{
            Header: SignInHeader
          }}
          loginMechanisms={['email']}
          signUpAttributes={['email']}
          initialState="signIn"
          socialProviders={isGoogleAuthEnabled ? ['google'] : []}
        />
      </div>
    );
  }

  return null; // Will redirect to /games if authenticated
}
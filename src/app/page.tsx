'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import DashboardLayout from '../components/DashboardLayout';

function SignInHeader() {
  return (
    <div className="flex flex-col items-center mb-4">
      <h3 className="text-xl font-semibold">Sign in to Game Match App</h3>
      <p className="text-sm text-gray-600">Use your email or Google account</p>
    </div>
  );
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email || '');
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    getUserEmail();
  }, []);

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
          {({ signOut, user }) => (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">
                Welcome {userEmail || user?.username || 'User'}!
              </h1>
              <div className="flex justify-between items-center">
                <p>You are now signed in to the Game Match App</p>
                <button
                  onClick={signOut}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </Authenticator>
      </main>
    </DashboardLayout>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SITE_TITLE } from '../constant';
import { signIn, confirmSignIn, fetchUserAttributes } from 'aws-amplify/auth';
import { TextField, Button, CircularProgress, Alert } from '@mui/material';

export default function Home() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { nextStep } = await signIn({
        username: email,
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      });
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE' ||
        nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_FIRST_FACTOR_SELECTION'
      ) {
        setShowConfirmation(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { nextStep: confirmSignInNextStep } = await confirmSignIn({ challengeResponse: code });

      if (confirmSignInNextStep.signInStep === 'DONE') {
      const attributes = await fetchUserAttributes();
      if (attributes.email) {
        router.push('/games');
      }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Sign in to {SITE_TITLE}</h1>
          <p className="text-gray-600">
            {showConfirmation ? 'Enter the code sent to your email' : 'Enter your email to receive a code'}
          </p>
        </div>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {!showConfirmation ? (
          <form onSubmit={handleSignIn}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="mb-4"
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              className="mt-2"
            >
              {loading ? <CircularProgress size={24} /> : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirmSignIn}>
            <TextField
              fullWidth
              label="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              required
              className="mb-4"
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              className="mt-2"
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
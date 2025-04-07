'use client';

import { Authenticator, Flex, Divider, Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminOnlySignUp, isGoogleAuthEnabled, oidcProvider, SITE_TITLE } from '../constant';
import { fetchUserAttributes, getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import { Box, CircularProgress, Typography } from '@mui/material';

function SignInHeader() {
  return (
    <div className="flex flex-col items-center justify-center"
         style={{ 
           padding: '1.5rem 1rem 1rem'
         }}>
      <h3 className="text-xl font-semibold mb-1"
          style={{ color: 'var(--amplify-colors-font-primary)' }}>
        Sign in to {SITE_TITLE}
      </h3>
      <p className="text-sm"
         style={{ color: 'var(--amplify-colors-font-secondary)' }}>
        {isGoogleAuthEnabled ? 'Use your email or Google account' : 'Use your email to sign in'}
      </p>
    </div>
  );
}

function AuthenticatedRoute({ user }: { user: any }) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/games');
    }
  }, [user, router]);

  return (
    <div>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography>Page is preparing...</Typography>
      </Box>
    </div>
  );
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email || '');
      } catch (error) {
        console.debug('Error fetching user attributes:', error);
        setUserEmail('');
      }
    };
    getUserEmail();
  }, []);

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Authenticator
          components={{
            Header: SignInHeader,
            SignIn: {
              Header() {
                if (!oidcProvider) {
                  return null;
                }

                return (
                  <div className="px-8 py-2">
                    <Flex direction="column"
                          className="federated-sign-in-container">
                          <Button
                            onClick={async () => {
                              await signInWithRedirect({
                                provider: {
                                  custom: oidcProvider!
                                }
                              });
                            }}
                            className="federated-sign-in-button"
                            gap="1rem"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="#000"
                              version="1.1"
                              viewBox="0 0 32 32"
                              xmlSpace="preserve"
                              className="amplify-icon federated-sign-in-icon"
                            >
                              <path
                                d="M31 31.36H1v-.72h30v.72zm0-7H1A.36.36 0 01.64 24V1A.36.36 0 011 .64h30a.36.36 0 01.36.36v23a.36.36 0 01-.36.36zm-29.64-.72h29.28V1.36H1.36v22.28zm7.304-7.476c-.672 0-1.234-.128-1.687-.385s-.842-.6-1.169-1.029l.798-.644c.28.355.593.628.938.819.345.191.747.287 1.204.287.476 0 .847-.103 1.113-.308.266-.206.399-.495.399-.868 0-.28-.091-.52-.273-.721-.182-.201-.511-.338-.987-.414l-.574-.084a4.741 4.741 0 01-.924-.217c-.28-.098-.525-.229-.735-.392s-.374-.366-.49-.609a1.983 1.983 0 01-.175-.868c0-.354.065-.665.196-.931.13-.266.31-.488.539-.665s.501-.311.819-.399a3.769 3.769 0 011.022-.133c.588 0 1.08.103 1.477.308.396.206.744.49 1.043.854l-.742.672c-.159-.224-.392-.427-.7-.609-.308-.182-.695-.272-1.162-.272s-.819.1-1.057.3c-.238.201-.357.474-.357.819 0 .354.119.611.357.77.238.159.581.275 1.029.35l.56.084c.803.122 1.372.353 1.708.693.336.341.504.786.504 1.337 0 .7-.238 1.251-.714 1.652-.476.402-1.13.603-1.96.603zm6.733 0c-.672 0-1.234-.128-1.687-.385s-.842-.6-1.169-1.029l.798-.644c.28.355.593.628.938.819.345.191.747.287 1.204.287.476 0 .847-.103 1.113-.308.266-.206.399-.495.399-.868 0-.28-.091-.52-.273-.721-.182-.201-.511-.338-.987-.413l-.574-.084c-.336-.046-.644-.119-.924-.217s-.525-.229-.735-.392-.374-.366-.49-.609a1.983 1.983 0 01-.175-.868c0-.354.065-.665.196-.931.13-.266.31-.488.539-.665.229-.177.501-.311.819-.399a3.769 3.769 0 011.022-.133c.588 0 1.08.103 1.477.308.396.206.744.49 1.043.854l-.742.672c-.158-.224-.392-.427-.7-.609s-.695-.273-1.162-.273-.819.101-1.057.301c-.238.201-.357.474-.357.819 0 .354.119.611.357.77s.581.275 1.029.35l.56.084c.803.122 1.372.353 1.708.693.337.341.505.786.505 1.337 0 .7-.238 1.251-.715 1.652-.475.401-1.129.602-1.96.602zm7.378 0c-.485 0-.929-.089-1.33-.266s-.744-.432-1.028-.763a3.584 3.584 0 01-.665-1.19 4.778 4.778 0 01-.238-1.561c0-.569.079-1.087.238-1.554a3.56 3.56 0 01.665-1.197c.284-.332.627-.586 1.028-.763s.845-.266 1.33-.266.927.089 1.323.266.739.432 1.029.763c.289.331.513.73.672 1.197.158.467.238.985.238 1.554 0 .579-.08 1.099-.238 1.561a3.546 3.546 0 01-.672 1.19c-.29.331-.633.585-1.029.763a3.19 3.19 0 01-1.323.266zm0-.995c.606 0 1.102-.187 1.484-.56.383-.373.574-.942.574-1.708v-1.036c0-.765-.191-1.334-.574-1.708s-.878-.56-1.484-.56-1.102.187-1.483.56c-.383.374-.574.943-.574 1.708v1.036c0 .766.191 1.335.574 1.708.382.374.877.56 1.483.56z"></path>
                              <path fill="none" d="M0 0H32V32H0z"></path>
                            </svg>
                            <span style={{color: "white !important"}}>Sign In with {oidcProvider}</span>
                          </Button>
                        <Divider label="or" size="small"/>
                    </Flex>
                  </div>
                );
              }
            }
          }}
          loginMechanisms={['email']}
          signUpAttributes={['email']}
          initialState="signIn"
          socialProviders={isGoogleAuthEnabled ? ['google'] : []}
          hideSignUp={Boolean(oidcProvider || isGoogleAuthEnabled || adminOnlySignUp)}
        >
          {({ user }) => <AuthenticatedRoute user={user} />}
        </Authenticator>
      </div>
    );
  }

  return null; // Will redirect to /games if authenticated
}
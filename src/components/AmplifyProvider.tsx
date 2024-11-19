'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from '../../amplify_outputs.json';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: config.auth.user_pool_client_id,
      userPoolId: config.auth.user_pool_id,
      identityPoolId: config.auth.identity_pool_id,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        oauth: {
          domain: config.auth.oauth.domain,
          scopes: config.auth.oauth.scopes,
          redirectSignIn: config.auth.oauth.redirect_sign_in_uri,
          redirectSignOut: config.auth.oauth.redirect_sign_out_uri,
          responseType: 'code',
          providers: ['Google']
        }
      }
    }
  }
}, { ssr: true });

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      {children}
    </Authenticator.Provider>
  );
}

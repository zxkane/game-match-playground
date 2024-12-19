import { authConfig } from '../constants';
import { defineAuth, secret } from '@aws-amplify/backend';

const { isGoogleAuthEnabled, oidcProvider } = authConfig;
const isDevelopment = process.env.NODE_ENV === 'development';
const productionDomain = process.env.PRODUCTION_DOMAIN;
const oidcProviderIssuerUrl = process.env.AUTH_OIDC_PROVIDER_ISSUER_URL;

const baseUrl = isDevelopment ? 'http://localhost:3000' : `https://${productionDomain}`;

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      ...(isGoogleAuthEnabled ? {
        google: {
          clientId: secret('GOOGLE_CLIENT_ID'),
          clientSecret: secret('GOOGLE_CLIENT_SECRET'),
          scopes: ['email', 'profile', 'openid']
        }
      } : {}),
      callbackUrls: [
        `${baseUrl}/`,
        ...(isGoogleAuthEnabled ? [`${baseUrl}/api/auth/callback/google`] : [])
      ],
      logoutUrls: [
        `${baseUrl}/`
      ],
      oidc: [
        ...(oidcProvider && oidcProviderIssuerUrl ? [{
          name: oidcProvider,
          clientId: secret(`${oidcProvider}_CLIENT_ID`),
          clientSecret: secret(`${oidcProvider}_CLIENT_SECRET`),
          issuerUrl: oidcProviderIssuerUrl,
          attributeMapping: {
            email: 'EMAIL'
          },
        }] : []),
      ],
    }
  }
});
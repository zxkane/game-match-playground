import { isGoogleAuthEnabled } from '@/constant';
import { defineAuth, secret } from '@aws-amplify/backend';

const isDevelopment = process.env.NODE_ENV === 'development';
const productionDomain = process.env.PRODUCTION_DOMAIN;

const baseUrl = isDevelopment ? 'http://localhost:3000' : `https://${productionDomain}`;

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid']
      },
      callbackUrls: [
        `${baseUrl}/`,
        ...(isGoogleAuthEnabled ? [`${baseUrl}/api/auth/callback/google`] : [])
      ],
      logoutUrls: [
        `${baseUrl}/`
      ]
    }
  }
});
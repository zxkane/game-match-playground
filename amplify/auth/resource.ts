import { defineAuth, secret } from '@aws-amplify/backend';

const isDevelopment = process.env.NODE_ENV === 'development';
const productionDomain = process.env.PRODUCTION_DOMAIN;

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
        ...(isDevelopment ? [
          'http://localhost:3000/',
          'http://localhost:3000/api/auth/callback/google'
        ] : [
          `https://${productionDomain}/`,
          `https://${productionDomain}/api/auth/callback/google`
        ])
      ],
      logoutUrls: [
        ...(isDevelopment ? [
          'http://localhost:3000/'
        ] : [
          `https://${productionDomain}/`
        ])
      ]
    }
  }
});
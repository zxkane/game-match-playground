import { isGoogleAuthEnabled, oidcProvider } from '@/constant';
import { defineAuth, secret } from '@aws-amplify/backend';

const isDevelopment = process.env.NODE_ENV === 'development';
const productionDomain = process.env.PRODUCTION_DOMAIN;
const oidcProviderIssuerUrl = process.env.AUTH_OIDC_PROVIDER_ISSUER_URL;

const baseUrl = isDevelopment ? 'http://localhost:3000' : `https://${productionDomain}`;

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: (createCode) => `Your verification code is ${createCode()}`,
      verificationEmailStyle: 'CODE'
    },
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
          scopes: ['email', 'profile', 'openid'],
          attributeMapping: {
            email: 'email',
            emailVerified: 'email_verified'
          },
          attributeRequestMethod: "POST" as const,
        }] : []),
      ],
    }
  },
  signUpAttributes: ['email'],
  allowedSignUpAttributes: [],
  userAttributes: {
    email: {
      required: true,
      mutable: true
    }
  }
});
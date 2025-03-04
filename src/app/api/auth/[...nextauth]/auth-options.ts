import type { NextAuthOptions } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    sub: string;
  }
}

if (!process.env.OIDC_CLIENT_ID || !process.env.OIDC_CLIENT_SECRET || !process.env.OIDC_ISSUER_URL) {
  throw new Error('Missing required environment variables for OIDC configuration');
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'oidc',
      name: 'OIDC Provider',
      type: 'oauth',
      issuer: process.env.OIDC_ISSUER_URL,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      wellKnown: `${process.env.OIDC_ISSUER_URL}/.well-known/openid-configuration`,
      authorization: { 
        params: { 
          scope: 'openid email profile',
          response_type: 'code',
          nonce: undefined
        } 
      },
      idToken: true,
      checks: ['state', 'nonce'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: true,
  // Add callback URL configuration
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://')
      }
    }
  }
};

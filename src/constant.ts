export const SITE_TITLE = 'Game Playground';

export const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_EXTERNAL_PROVIDERS?.includes('google') || false;
export const oidcProvider = process.env.NEXT_PUBLIC_OIDC_PROVIDER;
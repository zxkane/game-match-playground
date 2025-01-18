export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/games/:path*',
    '/api/games/:path*',
    '/profile',
  ],
}; 
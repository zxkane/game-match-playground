/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for AWS Lambda Web Adapter
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/football/**',
      },
    ],
    unoptimized: true, // Better for serverless environments
  },
};

module.exports = nextConfig;

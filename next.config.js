/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
    unoptimized: true,
  },
  serverExternalPackages: ['firebase-admin'],
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — this is a client-rendered SPA backed by a separate Express API
  output: 'export',
  trailingSlash: true,
  images: {
    // Static export requires unoptimized images (or a custom loader)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 't.me',
      },
      {
        protocol: 'https',
        hostname: 'api.telegram.org',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;

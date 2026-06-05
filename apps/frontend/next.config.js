const path = require('path');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');
const frontendNodeModules = path.resolve(__dirname, 'node_modules');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  transpilePackages: ['@drift-deck/types', '@drift-deck/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 't.me' },
      { protocol: 'https', hostname: 'api.telegram.org' },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack(config, { isServer }) {
    // Single React instance — use the frontend's local copy for everything.
    // This prevents dual-React context null errors in a monorepo where
    // some deps are hoisted to root node_modules.
    const reactPath = path.dirname(require.resolve('react/package.json'));
    const reactDomPath = path.dirname(require.resolve('react-dom/package.json'));

    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactPath,
      'react-dom': reactDomPath,
    };

    return config;
  },
};

module.exports = nextConfig;

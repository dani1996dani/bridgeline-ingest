import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Set high to handle multiple files at once
    },
  },
};

export default nextConfig;

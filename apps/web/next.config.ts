import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@platform/shared',
    '@platform/database',
    '@platform/ai',
    '@platform/pipeline',
    '@platform/media',
    '@platform/evaluation',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.vercel-blob.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  serverExternalPackages: ['@anthropic-ai/sdk', 'openai'],
};

export default nextConfig;

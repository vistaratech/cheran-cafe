import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Referrer-Policy',
          value: 'origin'
        }
      ],
    }
  ],
  /* config options here */
  // TypeScript strictness enforced at build time
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/menu',
        destination: '/restaurant',
        permanent: true,
      }
    ]
  },
};

export default nextConfig;;
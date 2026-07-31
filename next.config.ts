import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Referrer-Policy',
          value: 'origin'
        }
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ],
  /* config options here */
  // TypeScript strictness enforced at build time
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
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

export default nextConfig;
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development (MinIO)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/deebop-media/**',
      },
      // Supabase Storage (Production)
      {
        protocol: 'https',
        hostname: 'shoxlvymohfnelxebscm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Allow localhost images in development (Next.js 16 blocks private IPs by default)
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;

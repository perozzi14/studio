
import type {NextConfig} from 'next';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  }
});

const nextConfig: NextConfig = {
  /* config options here */
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
  webpack: (config) => {
    // These aliases are to fix build errors from dependencies.
    // Some packages have optional dependencies that are not used but cause build failures.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@opentelemetry/exporter-jaeger': false,
      'handlebars': 'handlebars/dist/handlebars.js',
    };
    return config;
  },
};

export default withPWA(nextConfig);

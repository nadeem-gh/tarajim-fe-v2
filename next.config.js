/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost', '127.0.0.1'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/api/admin',
        permanent: false,
      },
    ];
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/workspace/books/:path*',
        destination: 'http://localhost:8000/api/workspace/books/:path*',
      },
      {
        source: '/api/workspace/milestones/:path*',
        destination: 'http://localhost:8000/api/workspace/milestones/:path*',
      },
      {
        source: '/api/workspace/accounts/:path*',
        destination: 'http://localhost:8000/api/workspace/accounts/:path*',
      },
      // Note: epub-translations are handled by Next.js API routes, not rewrites
    ];
  },
  
  // Experimental features
  experimental: {
    // Disable CSS optimization to avoid critters dependency issues
    // optimizeCss: true,
  },
  
  // TypeScript configuration
  typescript: {
    // Don't fail build on type errors in production
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // ESLint configuration
  eslint: {
    // Don't fail build on ESLint errors in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const apiProxy =
  process.env.API_PROXY_TARGET || process.env.API_INTERNAL_ORIGIN || 'http://127.0.0.1:8000';

const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ];
  },
  async rewrites() {
    // If deployed on Vercel, route /api to the Vercel experimental API service /_/api
    if (process.env.VERCEL === '1') {
      return [
        {
          source: '/api/:path*',
          destination: '/_/api/:path*',
        },
      ];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxy.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

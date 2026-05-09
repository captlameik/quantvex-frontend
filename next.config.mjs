/** @type {import('next').NextConfig} */
const apiProxy =
  process.env.API_PROXY_TARGET || process.env.API_INTERNAL_ORIGIN || 'http://127.0.0.1:8000';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxy.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

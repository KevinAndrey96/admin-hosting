/** @type {import('next').NextConfig} */
const BASE_PATH = '/admin';
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  output: 'standalone',
  reactStrictMode: true,
  async redirects() {
    return [
      // Root of app -> signin (avoids basePath duplication on cPanel)
      { source: '/', destination: '/signin', permanent: false },
    ];
  },
  images: {
    domains: ['randomuser.me'],
    unoptimized: true, // Disable image optimization for cPanel compatibility
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig

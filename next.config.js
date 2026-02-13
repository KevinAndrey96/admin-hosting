/** @type {import('next').NextConfig} */
const BASE_PATH = '/admin';
const nextConfig = {
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['randomuser.me'],
    unoptimized: true, // Disable image optimization for cPanel compatibility
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig

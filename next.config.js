/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['randomuser.me'],
    unoptimized: true, // Disable image optimization for cPanel compatibility
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig

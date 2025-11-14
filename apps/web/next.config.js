/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@snub/core', '@snub/ui'],
  experimental: {
    optimizePackageImports: ['@snub/ui'],
  },
}

module.exports = nextConfig

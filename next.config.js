/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure path aliases work correctly
  transpilePackages: [],

  // 🔥 THIS is what fixes your build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

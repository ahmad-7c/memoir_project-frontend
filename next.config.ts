/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Pins Turbopack's project root explicitly. Without this, editing this
  // file can trigger Turbopack's workspace-root auto-detection to misfire
  // ("couldn't find next/package.json from src/app") on a dev-server
  // restart -- observed under this project's OneDrive-synced path, which
  // can confuse directory-tree heuristics that assume a plain local disk.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No remotePatterns: every image this app uses is either self-hosted
  // under public/images (see CREDITS.md) or a short-lived signed Supabase
  // URL served through a raw <img> tag, not next/image. A stray remote
  // pattern here is a latent hotlink path this project no longer needs.
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

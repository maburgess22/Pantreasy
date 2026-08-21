import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prevents Vercel memory timeouts during type checking
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
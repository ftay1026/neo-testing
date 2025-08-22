import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'https://https://supreme-doodle-wv57vg5593gj55-3000.app.github.dev/']
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lljydrvrqipjgpmpdqqf.supabase.co',
      }
    ],
  },
};

export default nextConfig;

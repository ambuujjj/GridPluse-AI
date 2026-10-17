import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Proxy API requests to the backend in development.
     In production on Vercel, set the NEXT_PUBLIC_API_URL env var
     to point to your deployed Railway/Render backend URL. */
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;

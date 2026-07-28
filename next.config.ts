import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://localhost:3000"],
  async rewrites() {
    return [
      {
        // Routed internally to src/app/api/backend-api/[...path]/route.ts
        // so the app's x-api-key can be attached server-side before the
        // request is forwarded to the backend: https://api.priceil.dev.
        source: "/backend-api/:path*",
        destination: "/api/backend-api/:path*",
      },
    ];
  },
};

export default nextConfig;

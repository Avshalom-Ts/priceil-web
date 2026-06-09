import type { NextConfig } from "next";

const API_TARGET = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://177.178.179.14:3000"
    : "https://api.priceil.dev")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["12.5.93.14"],
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${API_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.BACKEND_INTERNAL_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://nesteeq.onrender.com"
        : "http://localhost:6001");

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl.replace(/\/$/, "")}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl.replace(/\/$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

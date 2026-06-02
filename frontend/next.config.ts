import type { NextConfig } from "next";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const apiOrigin = new URL(apiBase);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port || undefined,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;

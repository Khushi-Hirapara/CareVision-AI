import type { NextConfig } from "next";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const apiOrigin = new URL(apiBase);
const protocol = apiOrigin.protocol.replace(":", "") as "http" | "https";
const port = apiOrigin.port || undefined;

const apiHosts = Array.from(
  new Set([apiOrigin.hostname, "localhost", "127.0.0.1"]),
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiHosts.map((hostname) => ({
      protocol,
      hostname,
      port,
      pathname: "/uploads/**",
    })),
  },
};

export default nextConfig;

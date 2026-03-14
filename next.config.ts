import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/play/shrink", destination: "/play/shrinking-target", permanent: true },
  ],
};

export default nextConfig;

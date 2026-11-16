import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // src/lib/image.ts의 OPTIMIZED_HOSTS와 맞출 것
    remotePatterns: [
      { protocol: "https", hostname: "**.coupangcdn.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

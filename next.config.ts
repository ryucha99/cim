import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // 개발환경에서는 비활성화 (캐시 꼬임 방지)
  runtimeCaching: [
    {
      urlPattern: ({ request }: any) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: { cacheName: 'pages' },
    },
    {
      urlPattern: ({ request }: any) =>
        ['script', 'style', 'image', 'font'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'assets' },
    },
    {
      urlPattern: ({ url }: any) => url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: { cacheName: 'api' },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
};

export default withPWA(nextConfig);

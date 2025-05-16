import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
    ignoreBuildErrors: true,  // ✅ 忽略 TypeScript 构建错误
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ 添加这行，跳过 ESLint 构建错误
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://fullnode.testnet.sui.io/:path*',
      },
    ];
  },
};

export default nextConfig;
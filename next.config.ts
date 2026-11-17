import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  // 按页切字要读源字体；让部署时把它带进函数包，别漏
  outputFileTracingIncludes: {
    "/api/font/**": ["./assets/fonts/*.ttf"],
  },
  // harfbuzz 的 wasm 由包自己按路径加载，交给 Node 解析
  serverExternalPackages: ["subset-font"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 서버 액션 본문 기본 한도는 1MB — 이력서 파일(최대 10MB)을 받으려면 올려야 한다
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

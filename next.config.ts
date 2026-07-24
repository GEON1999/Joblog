import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 서버 액션 본문 기본 한도는 1MB — 문서 업로드(최대 4MB)를 받으려면 올려야 한다.
    // Vercel 서버리스는 플랫폼 차원에서 4.5MB로 캡되므로 그 아래로 둔다.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;

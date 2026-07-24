import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { requireEnv } from "@/lib/env";

// 유저별 ICS 피드 토큰 = HMAC(ICS_FEED_SECRET, userId) (ADR 0010).
// 캘린더 클라이언트는 세션 쿠키를 못 실으므로, uid + 토큰을 URL로 받아 검증한다.
// 새 테이블 없이 유저별 격리를 얻는다. userId(UUID)는 비밀이 아니고 토큰이 비밀이다.
export function icsToken(userId: string): string {
  return createHmac("sha256", requireEnv("ICS_FEED_SECRET")).update(userId).digest("hex");
}

export function verifyIcsToken(userId: string, provided: string): boolean {
  const expected = icsToken(userId);
  // 길이가 다르면 timingSafeEqual이 throw하므로 먼저 거른다
  if (provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

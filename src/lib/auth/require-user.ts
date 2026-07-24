import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// 서버 액션·서버 전용 로직의 심층 방어. 라우트 보호는 proxy가 하지만,
// 뮤테이션은 proxy 매처 변경 실수에 대비해 자체적으로도 세션을 검증한다.
// 오픈 서비스라 로그인된 유저면 누구나 통과한다 — 데이터 격리는 각 쿼리의 userId 필터가 담당한다 (ADR 0010).
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

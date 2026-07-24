import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isAllowedEmail } from "./allowlist";

// 서버 액션·서버 전용 로직의 심층 방어. 라우트 보호는 proxy가 하지만,
// 뮤테이션은 proxy 매처 변경 실수에 대비해 자체적으로도 세션을 검증한다
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedEmail(user.email)) {
    redirect("/login");
  }

  return user;
}

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireEnv } from "@/lib/env";

export const DOCUMENTS_BUCKET = "documents";

// service role 키는 RLS·스토리지 정책을 전부 우회한다 — 서버에서만, 절대 클라이언트로 노출 금지 (ADR 0008)
export function createStorageClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

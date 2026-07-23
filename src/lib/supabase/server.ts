import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy가 담당한다.
          }
        },
      },
    },
  );
}

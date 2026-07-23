import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { requireEnv } from "@/lib/env";

import * as schema from "./schema";

// Supabase connection pooler(transaction mode)는 prepared statement를 지원하지 않는다 — ADR 0005
// dev 핫 리로드 시 커넥션이 누적되지 않도록 전역에 캐시한다
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client = globalForDb.pgClient ?? postgres(requireEnv("DATABASE_URL"), { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });

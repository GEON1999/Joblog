import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { requireEnv } from "@/lib/env";

import * as schema from "./schema";

type Database = ReturnType<typeof createDb>;

function createDb() {
  // Supabase connection pooler(transaction mode)는 prepared statement를 지원하지 않는다 — ADR 0005
  const client = postgres(requireEnv("DATABASE_URL"), { prepare: false });
  return drizzle(client, { schema });
}

// lazy 싱글톤: env가 없는 빌드 시점 모듈 평가에서 터지지 않게 하고,
// dev 핫 리로드 시 커넥션이 누적되지 않도록 전역에 캐시한다
const globalForDb = globalThis as unknown as { db?: Database };

export function getDb(): Database {
  return (globalForDb.db ??= createDb());
}

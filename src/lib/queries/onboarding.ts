import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { SAMPLE_COMPANY_NAMES } from "@/lib/domain/sample-data";

// 유저에게 온보딩 샘플 데이터가 있는지 — 채우기/비우기 토글 표시에 쓴다 (ADR 0010)
export async function hasSampleData(userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.userId, userId), inArray(companies.name, SAMPLE_COMPANY_NAMES)))
    .limit(1);
  return Boolean(row);
}

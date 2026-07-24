import { asc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, nextActions } from "@/lib/db/schema";
import { buildIcsCalendar, type IcsEvent } from "@/lib/domain/ics";
import { NEXT_ACTION_KIND_LABELS } from "@/lib/domain/next-action";

// 캘린더 클라이언트가 폴링하는 공개 엔드포인트 — 세션이 아닌 토큰으로 인증한다 (ADR 0007)
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const expected = process.env.ICS_FEED_TOKEN;

  if (!expected || token !== expected) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await getDb()
    .select({
      id: nextActions.id,
      title: nextActions.title,
      kind: nextActions.kind,
      dueAt: nextActions.dueAt,
      companyName: companies.name,
      applicationTitle: applications.title,
    })
    .from(nextActions)
    .innerJoin(applications, eq(nextActions.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(isNull(nextActions.doneAt))
    .orderBy(asc(nextActions.dueAt));

  const events: IcsEvent[] = rows.map((row) => ({
    uid: `${row.id}@joblog`,
    title: `[${row.companyName}] ${row.title}`,
    start: row.dueAt,
    description: `${row.applicationTitle} · ${NEXT_ACTION_KIND_LABELS[row.kind]}`,
  }));

  const body = buildIcsCalendar(events, new Date());

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="joblog.ics"',
      "Cache-Control": "no-store",
    },
  });
}

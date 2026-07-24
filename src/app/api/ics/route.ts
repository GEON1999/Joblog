import { and, asc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, nextActions } from "@/lib/db/schema";
import { buildIcsCalendar, type IcsEvent } from "@/lib/domain/ics";
import { NEXT_ACTION_KIND_LABELS } from "@/lib/domain/next-action";
import { verifyIcsToken } from "@/lib/ics-token";
import { isUuid } from "@/lib/uuid";

// 캘린더 클라이언트가 폴링하는 공개 엔드포인트 — 세션이 아닌 유저별 HMAC 토큰으로 인증한다 (ADR 0007, 0010).
// ?uid=<userId>&token=<hmac> 로 받아 검증한 뒤, 그 유저의 미완료 액션만 내려준다.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  if (!isUuid(uid) || !token || !verifyIcsToken(uid, token)) {
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
    .where(
      and(
        eq(applications.userId, uid),
        isNull(nextActions.doneAt),
        eq(applications.outcome, "in_progress"),
      ),
    )
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

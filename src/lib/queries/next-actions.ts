import { and, asc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, nextActions, type NextAction } from "@/lib/db/schema";

export async function getNextActionsForApplication(applicationId: string): Promise<NextAction[]> {
  return getDb()
    .select()
    .from(nextActions)
    .where(eq(nextActions.applicationId, applicationId))
    .orderBy(asc(nextActions.dueAt));
}

export interface PendingAction {
  action: NextAction;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
}

/**
 * 진행중인 지원의 미완료 액션 — 대시보드 임박/지연 목록과 ICS 피드의 원천.
 * 종료된 지원의 액션은 더 이상 챙길 일이 아니므로 제외한다 (팔로업 배지와 동일 기준).
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  const rows = await getDb()
    .select({
      action: nextActions,
      applicationId: applications.id,
      applicationTitle: applications.title,
      companyName: companies.name,
    })
    .from(nextActions)
    .innerJoin(applications, eq(nextActions.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(isNull(nextActions.doneAt), eq(applications.outcome, "in_progress")))
    .orderBy(asc(nextActions.dueAt));

  return rows;
}

/** 미완료 액션이 하나라도 있는 지원 id 집합 — 팔로업 배지 계산에 쓴다 */
export async function getApplicationIdsWithPendingActions(): Promise<Set<string>> {
  const rows = await getDb()
    .selectDistinct({ applicationId: nextActions.applicationId })
    .from(nextActions)
    .where(isNull(nextActions.doneAt));

  return new Set(rows.map((row) => row.applicationId));
}

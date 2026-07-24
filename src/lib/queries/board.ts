import { and, eq, max } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, companies, stageTransitions, type Stage } from "@/lib/db/schema";

export interface BoardCard {
  id: string;
  title: string;
  stage: Stage;
  companyName: string;
  stageEnteredAt: Date;
}

// 진행중인 지원을 현재 단계 진입 시각과 함께 가져온다
export async function getBoardCards(userId: string): Promise<BoardCard[]> {
  const rows = await getDb()
    .select({
      id: applications.id,
      title: applications.title,
      stage: applications.stage,
      appliedAt: applications.appliedAt,
      companyName: companies.name,
      stageEnteredAt: max(stageTransitions.occurredAt),
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .leftJoin(stageTransitions, eq(stageTransitions.applicationId, applications.id))
    .where(and(eq(applications.userId, userId), eq(applications.outcome, "in_progress")))
    .groupBy(applications.id, companies.name);

  return rows
    .map(({ appliedAt, stageEnteredAt, ...row }) => ({
      ...row,
      stageEnteredAt: stageEnteredAt ?? appliedAt,
    }))
    .sort((a, b) => a.stageEnteredAt.getTime() - b.stageEnteredAt.getTime());
}

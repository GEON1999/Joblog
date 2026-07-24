import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, stageTransitions } from "@/lib/db/schema";
import { computeFunnel, type StageFunnel } from "@/lib/domain/funnel";

export interface DashboardData {
  totals: {
    all: number;
    inProgress: number;
    accepted: number;
    closed: number;
  };
  funnel: StageFunnel[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const db = getDb();

  const [allApplications, allTransitions] = await Promise.all([
    db
      .select({
        id: applications.id,
        stage: applications.stage,
        outcome: applications.outcome,
        closedAt: applications.closedAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId)),
    // 전환 이력도 내 지원 것만 — 지원 조인으로 소유권을 스코프한다
    db
      .select({
        applicationId: stageTransitions.applicationId,
        fromStage: stageTransitions.fromStage,
        toStage: stageTransitions.toStage,
        occurredAt: stageTransitions.occurredAt,
      })
      .from(stageTransitions)
      .innerJoin(applications, eq(stageTransitions.applicationId, applications.id))
      .where(eq(applications.userId, userId)),
  ]);

  return {
    totals: {
      all: allApplications.length,
      inProgress: allApplications.filter((app) => app.outcome === "in_progress").length,
      accepted: allApplications.filter((app) => app.outcome === "accepted").length,
      closed: allApplications.filter((app) => app.outcome !== "in_progress").length,
    },
    funnel: computeFunnel(allApplications, allTransitions),
  };
}

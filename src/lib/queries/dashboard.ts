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

export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb();

  const [allApplications, allTransitions] = await Promise.all([
    db
      .select({
        id: applications.id,
        stage: applications.stage,
        outcome: applications.outcome,
        closedAt: applications.closedAt,
      })
      .from(applications),
    db
      .select({
        applicationId: stageTransitions.applicationId,
        fromStage: stageTransitions.fromStage,
        toStage: stageTransitions.toStage,
        occurredAt: stageTransitions.occurredAt,
      })
      .from(stageTransitions),
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

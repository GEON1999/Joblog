import { asc, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  applications,
  companies,
  postingSnapshots,
  stageTransitions,
  type Application,
  type PostingSnapshot,
  type StageTransition,
} from "@/lib/db/schema";

export interface ApplicationDetail {
  application: Application;
  companyName: string;
  transitions: StageTransition[];
  snapshot: PostingSnapshot | null;
}

export async function getApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({ application: applications, companyName: companies.name })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, id));

  if (!row) {
    return null;
  }

  const transitions = await db
    .select()
    .from(stageTransitions)
    .where(eq(stageTransitions.applicationId, id))
    .orderBy(asc(stageTransitions.occurredAt));

  const [snapshot] = await db
    .select()
    .from(postingSnapshots)
    .where(eq(postingSnapshots.applicationId, id));

  return { ...row, transitions, snapshot: snapshot ?? null };
}

export interface ArchivedApplication {
  id: string;
  title: string;
  companyName: string;
  stage: Application["stage"];
  outcome: Application["outcome"];
  appliedAt: Date;
  closedAt: Date | null;
}

export async function getArchivedApplications(): Promise<ArchivedApplication[]> {
  return getDb()
    .select({
      id: applications.id,
      title: applications.title,
      companyName: companies.name,
      stage: applications.stage,
      outcome: applications.outcome,
      appliedAt: applications.appliedAt,
      closedAt: applications.closedAt,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(ne(applications.outcome, "in_progress"))
    .orderBy(desc(applications.closedAt));
}

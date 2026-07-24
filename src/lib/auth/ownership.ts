import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { applications, interviews, nextActions } from "@/lib/db/schema";

// 루트만 user_id 를 가지므로(ADR 0010), 자식 레코드의 소유권은 부모 지원을 조인해 검증한다.
// id 로 직접 수정/삭제하는 뮤테이션에서 "남의 자식 건드리기"를 막는 관문이다.

export async function ownsApplication(userId: string, applicationId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));
  return Boolean(row);
}

export async function ownsInterview(userId: string, interviewId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: interviews.id })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .where(and(eq(interviews.id, interviewId), eq(applications.userId, userId)));
  return Boolean(row);
}

export async function ownsNextAction(userId: string, nextActionId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: nextActions.id })
    .from(nextActions)
    .innerJoin(applications, eq(nextActions.applicationId, applications.id))
    .where(and(eq(nextActions.id, nextActionId), eq(applications.userId, userId)));
  return Boolean(row);
}

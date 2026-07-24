"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applications, companies, stageTransitions, type Stage } from "@/lib/db/schema";
import { STAGES } from "@/lib/domain/stage";
import { validateStageMove } from "@/lib/domain/stage-move";

export async function createApplication(formData: FormData) {
  await requireUser();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const appliedAtRaw = String(formData.get("appliedAt") ?? "").trim();

  if (!companyName || !title) {
    redirect("/applications/new?error=missing");
  }

  const appliedAt = appliedAtRaw ? new Date(appliedAtRaw) : new Date();
  if (Number.isNaN(appliedAt.getTime())) {
    redirect("/applications/new?error=invalid-date");
  }

  await getDb().transaction(async (tx) => {
    // get-or-create: 이름이 이미 있으면 그 회사를 그대로 쓴다
    const [company] = await tx
      .insert(companies)
      .values({ name: companyName })
      .onConflictDoUpdate({ target: companies.name, set: { name: companyName } })
      .returning({ id: companies.id });

    const [application] = await tx
      .insert(applications)
      .values({ companyId: company.id, title, appliedAt })
      .returning({ id: applications.id });

    // 초기 진입도 전환 기록으로 남긴다 — 체류 일수의 단일 출처는 stage_transitions
    await tx.insert(stageTransitions).values({
      applicationId: application.id,
      fromStage: null,
      toStage: "applied",
      occurredAt: appliedAt,
    });
  });

  revalidatePath("/");
  redirect("/");
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function moveApplicationStage(
  applicationId: string,
  toStage: Stage,
): Promise<{ error?: string }> {
  await requireUser();

  // 서버 액션 인자는 신뢰할 수 없는 입력이다 — 위조된 id가 uuid 캐스팅 예외(500)를 내지 않게 막는다
  if (!UUID_PATTERN.test(applicationId)) {
    return { error: "not-found" };
  }

  if (!STAGES.includes(toStage)) {
    return { error: "unknown-stage" };
  }

  const result = await getDb().transaction(async (tx) => {
    const [application] = await tx
      .select({ stage: applications.stage, outcome: applications.outcome })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application) {
      return { error: "not-found" };
    }

    const validation = validateStageMove(application.outcome, application.stage, toStage);
    if (!validation.ok) {
      return { error: validation.reason };
    }

    await tx.update(applications).set({ stage: toStage }).where(eq(applications.id, applicationId));

    await tx.insert(stageTransitions).values({
      applicationId,
      fromStage: application.stage,
      toStage,
    });

    return {};
  });

  revalidatePath("/");
  return result;
}

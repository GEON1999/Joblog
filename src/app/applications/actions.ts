"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import {
  applications,
  companies,
  postingSnapshots,
  stageTransitions,
  type Outcome,
  type Stage,
} from "@/lib/db/schema";
import { validateClose, validateReopen } from "@/lib/domain/outcome";
import { STAGES } from "@/lib/domain/stage";
import { validateStageMove } from "@/lib/domain/stage-move";
import { parseHttpUrl } from "@/lib/url";
import { isUuid } from "@/lib/uuid";

export async function createApplication(formData: FormData) {
  await requireUser();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const appliedAtRaw = String(formData.get("appliedAt") ?? "").trim();
  const postingContent = String(formData.get("postingContent") ?? "").trim();
  const postingUrl = String(formData.get("postingUrl") ?? "").trim();

  if (!companyName || !title) {
    redirect("/applications/new?error=missing");
  }

  const appliedAt = appliedAtRaw ? new Date(appliedAtRaw) : new Date();
  if (Number.isNaN(appliedAt.getTime())) {
    redirect("/applications/new?error=invalid-date");
  }

  const parsedPostingUrl = parseHttpUrl(postingUrl);
  if (postingUrl && !parsedPostingUrl) {
    redirect("/applications/new?error=invalid-url");
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

    // 공고 원문을 붙여넣었다면 지원 시점 스냅샷으로 함께 보존한다 — ADR 0004
    if (postingContent) {
      await tx.insert(postingSnapshots).values({
        applicationId: application.id,
        content: postingContent,
        sourceUrl: parsedPostingUrl,
      });
    }
  });

  revalidatePath("/");
  redirect("/");
}

export async function moveApplicationStage(
  applicationId: string,
  toStage: Stage,
): Promise<{ error?: string }> {
  await requireUser();

  // 서버 액션 인자는 신뢰할 수 없는 입력이다
  if (!isUuid(applicationId)) {
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

export async function savePostingSnapshot(applicationId: string, formData: FormData) {
  await requireUser();

  if (!isUuid(applicationId)) {
    redirect("/");
  }

  const content = String(formData.get("content") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!content) {
    redirect(`/applications/${applicationId}/snapshot?error=missing`);
  }

  const parsedSourceUrl = parseHttpUrl(sourceUrl);
  if (sourceUrl && !parsedSourceUrl) {
    redirect(`/applications/${applicationId}/snapshot?error=invalid-url`);
  }

  // 지원당 스냅샷 하나 — 이미 있으면 덮어쓴다 (수정 허용, ADR 0004).
  // $onUpdate는 update 쿼리에만 적용되므로 upsert에서는 updatedAt을 직접 갱신한다
  await getDb()
    .insert(postingSnapshots)
    .values({ applicationId, content, sourceUrl: parsedSourceUrl })
    .onConflictDoUpdate({
      target: postingSnapshots.applicationId,
      set: { content, sourceUrl: parsedSourceUrl, updatedAt: new Date() },
    });

  revalidatePath(`/applications/${applicationId}`);
  redirect(`/applications/${applicationId}`);
}

export async function closeApplication(
  applicationId: string,
  outcome: Outcome,
): Promise<{ error?: string }> {
  await requireUser();

  if (!isUuid(applicationId)) {
    return { error: "not-found" };
  }

  const result = await getDb().transaction(async (tx) => {
    const [application] = await tx
      .select({ outcome: applications.outcome })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application) {
      return { error: "not-found" };
    }

    const validation = validateClose(application.outcome, outcome);
    if (!validation.ok) {
      return { error: validation.reason };
    }

    await tx
      .update(applications)
      .set({ outcome, closedAt: new Date() })
      .where(eq(applications.id, applicationId));

    return {};
  });

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/applications/${applicationId}`);
  return result;
}

export async function reopenApplication(applicationId: string): Promise<{ error?: string }> {
  await requireUser();

  if (!isUuid(applicationId)) {
    return { error: "not-found" };
  }

  const result = await getDb().transaction(async (tx) => {
    const [application] = await tx
      .select({ outcome: applications.outcome })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application) {
      return { error: "not-found" };
    }

    const validation = validateReopen(application.outcome);
    if (!validation.ok) {
      return { error: validation.reason };
    }

    await tx
      .update(applications)
      .set({ outcome: "in_progress", closedAt: null })
      .where(eq(applications.id, applicationId));

    return {};
  });

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath(`/applications/${applicationId}`);
  return result;
}

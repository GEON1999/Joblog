"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { applications, companies, stageTransitions } from "@/lib/db/schema";

export async function createApplication(formData: FormData) {
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

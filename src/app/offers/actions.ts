"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applications, offers, type ContractType, type WorkMode } from "@/lib/db/schema";
import { parseOfferExtras } from "@/lib/domain/offer";
import { isUuid } from "@/lib/uuid";

const CONTRACT_TYPES = ["permanent", "contract", "freelance"];
const WORK_MODES = ["office", "remote", "hybrid"];

function optionalEnum<T extends string>(raw: string, allowed: string[]): T | null {
  return allowed.includes(raw) ? (raw as T) : null;
}

export async function upsertOffer(applicationId: string, formData: FormData) {
  const user = await requireUser();

  if (!isUuid(applicationId)) {
    redirect("/");
  }

  const detailPath = `/applications/${applicationId}`;

  const salaryRaw = String(formData.get("annualSalary") ?? "").trim();
  const crunchRaw = String(formData.get("crunch") ?? "").trim();

  let annualSalary: number | null = null;
  if (salaryRaw) {
    const parsed = Number(salaryRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      redirect(`${detailPath}?error=invalid-salary`);
    }
    annualSalary = parsed;
  }

  const values = {
    annualSalary,
    contractType: optionalEnum<ContractType>(
      String(formData.get("contractType") ?? ""),
      CONTRACT_TYPES,
    ),
    workMode: optionalEnum<WorkMode>(String(formData.get("workMode") ?? ""), WORK_MODES),
    // 라디오 미선택이면 미확인(null), yes/no면 boolean
    crunch: crunchRaw === "" ? null : crunchRaw === "yes",
    extras: parseOfferExtras(String(formData.get("extras") ?? "")),
  };

  // 오퍼 단계에 도달한 내 지원만 처우를 기록한다 — CONTEXT.md, 소유권 스코프 포함
  const [application] = await getDb()
    .select({ stage: applications.stage })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));

  if (!application) {
    redirect("/");
  }
  if (application.stage !== "offer") {
    redirect(`${detailPath}?error=not-offer-stage`);
  }

  // 지원당 오퍼 하나 — 있으면 덮어쓴다
  await getDb()
    .insert(offers)
    .values({ applicationId, ...values })
    .onConflictDoUpdate({
      target: offers.applicationId,
      set: { ...values, updatedAt: new Date() },
    });

  revalidatePath(detailPath);
  revalidatePath("/offers");
  redirect(detailPath);
}

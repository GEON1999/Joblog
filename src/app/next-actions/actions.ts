"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applications, nextActions, type NextActionKind } from "@/lib/db/schema";
import { parseKstDateTime } from "@/lib/domain/kst-datetime";
import { NEXT_ACTION_KINDS } from "@/lib/domain/next-action";
import { isUuid } from "@/lib/uuid";

export async function createNextAction(applicationId: string, formData: FormData) {
  await requireUser();

  if (!isUuid(applicationId)) {
    redirect("/");
  }

  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "other") as NextActionKind;
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  const detailPath = `/applications/${applicationId}`;

  if (!title) {
    redirect(`${detailPath}?error=missing-action-title`);
  }
  if (!NEXT_ACTION_KINDS.includes(kind)) {
    redirect(`${detailPath}?error=invalid-action-kind`);
  }
  const dueAt = parseKstDateTime(dueAtRaw);
  if (!dueAt) {
    redirect(`${detailPath}?error=invalid-action-due`);
  }

  const [application] = await getDb()
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, applicationId));

  if (!application) {
    redirect("/");
  }

  await getDb().insert(nextActions).values({ applicationId, title, kind, dueAt });

  revalidatePath(detailPath);
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(detailPath);
}

export async function toggleNextActionDone(nextActionId: string, applicationId: string) {
  await requireUser();

  if (!isUuid(nextActionId) || !isUuid(applicationId)) {
    redirect("/");
  }

  // 미완료면 완료로, 완료면 미완료로 토글한다
  const [current] = await getDb()
    .select({ doneAt: nextActions.doneAt })
    .from(nextActions)
    .where(eq(nextActions.id, nextActionId));

  if (current) {
    await getDb()
      .update(nextActions)
      .set({ doneAt: current.doneAt ? null : new Date() })
      .where(eq(nextActions.id, nextActionId));
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/applications/${applicationId}`);
}

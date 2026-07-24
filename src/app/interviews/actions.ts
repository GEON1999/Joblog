"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applications, interviewQuestions, interviews } from "@/lib/db/schema";
import { parseKstDateTime } from "@/lib/domain/kst-datetime";
import { parseTags } from "@/lib/domain/tags";
import { isUuid } from "@/lib/uuid";

export async function createInterview(applicationId: string, formData: FormData) {
  await requireUser();

  if (!isUuid(applicationId)) {
    redirect("/");
  }

  const round = String(formData.get("round") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const format = String(formData.get("format") ?? "").trim();

  if (!round) {
    redirect(`/applications/${applicationId}/interviews/new?error=missing`);
  }

  const scheduledAt = scheduledAtRaw ? parseKstDateTime(scheduledAtRaw) : null;
  if (scheduledAtRaw && !scheduledAt) {
    redirect(`/applications/${applicationId}/interviews/new?error=invalid-datetime`);
  }

  const [application] = await getDb()
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, applicationId));

  if (!application) {
    redirect("/");
  }

  const [interview] = await getDb()
    .insert(interviews)
    .values({ applicationId, round, scheduledAt, format: format || null })
    .returning({ id: interviews.id });

  revalidatePath(`/applications/${applicationId}`);
  redirect(`/interviews/${interview.id}`);
}

export async function saveRetrospective(interviewId: string, formData: FormData) {
  await requireUser();

  if (!isUuid(interviewId)) {
    redirect("/");
  }

  const retrospective = String(formData.get("retrospective") ?? "").trim();

  await getDb()
    .update(interviews)
    .set({ retrospective: retrospective || null })
    .where(eq(interviews.id, interviewId));

  revalidatePath(`/interviews/${interviewId}`);
  redirect(`/interviews/${interviewId}`);
}

export async function addInterviewQuestion(interviewId: string, formData: FormData) {
  await requireUser();

  if (!isUuid(interviewId)) {
    redirect("/");
  }

  const question = String(formData.get("question") ?? "").trim();
  const answerAtTime = String(formData.get("answerAtTime") ?? "").trim();
  const preparedAnswer = String(formData.get("preparedAnswer") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!question) {
    redirect(`/interviews/${interviewId}?error=missing-question`);
  }

  const [interview] = await getDb()
    .select({ id: interviews.id })
    .from(interviews)
    .where(eq(interviews.id, interviewId));

  if (!interview) {
    redirect("/");
  }

  await getDb()
    .insert(interviewQuestions)
    .values({
      interviewId,
      question,
      answerAtTime: answerAtTime || null,
      preparedAnswer: preparedAnswer || null,
      tags,
    });

  revalidatePath(`/interviews/${interviewId}`);
  revalidatePath("/questions");
  redirect(`/interviews/${interviewId}`);
}

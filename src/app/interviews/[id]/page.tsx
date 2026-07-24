import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { formatDate, formatDateTime } from "@/lib/format";
import { getInterviewDetail } from "@/lib/queries/interviews";
import { isUuid } from "@/lib/uuid";

import { addInterviewQuestion, saveRetrospective } from "../actions";

export const metadata: Metadata = {
  title: "면접 기록 — JobLog",
};

export default async function InterviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { id }, { error }] = await Promise.all([requireUser(), params, searchParams]);
  if (!isUuid(id)) {
    notFound();
  }

  const detail = await getInterviewDetail(id, user.id);
  if (!detail) {
    notFound();
  }

  const { interview, applicationId, applicationTitle, companyName, questions } = detail;

  return (
    <AppShell>
      <Link
        href={`/applications/${applicationId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 지원 상세로
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">
          {companyName} · {applicationTitle}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{interview.round} 면접</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : "일시 미정"}
          {interview.format && <> · {interview.format}</>}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">회고</h2>
        <form action={saveRetrospective.bind(null, interview.id)} className="mt-3">
          <textarea
            name="retrospective"
            rows={5}
            defaultValue={interview.retrospective ?? ""}
            placeholder="분위기, 잘한 점, 아쉬운 점을 면접 직후에 남겨두세요"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
          <button
            type="submit"
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            회고 저장
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">받은 질문 ({questions.length})</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {questions.map((question) => (
            <li key={question.id} className="rounded-md border border-border p-4">
              <p className="text-sm font-medium">{question.question}</p>
              {question.answerAtTime && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-muted-foreground">당시 답변</span> ·{" "}
                  {question.answerAtTime}
                </p>
              )}
              {question.preparedAnswer && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-muted-foreground">다시 준비한 답변</span> ·{" "}
                  {question.preparedAnswer}
                </p>
              )}
              {question.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(question.createdAt)} 기록
              </p>
            </li>
          ))}
        </ul>

        <form
          action={addInterviewQuestion.bind(null, interview.id)}
          className="mt-6 flex flex-col gap-3 rounded-md border border-border bg-surface-muted p-4"
        >
          <h3 className="text-sm font-semibold text-foreground">질문 추가</h3>
          <label className="flex flex-col gap-1 text-sm">
            질문
            <input
              type="text"
              name="question"
              required
              placeholder="예: pnpm과 npm의 차이가 뭔가요?"
              className="rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            당시 내 답변 <span className="text-xs font-normal text-muted-foreground">(선택)</span>
            <textarea
              name="answerAtTime"
              rows={2}
              className="rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            다시 준비한 답변{" "}
            <span className="text-xs font-normal text-muted-foreground">(선택)</span>
            <textarea
              name="preparedAnswer"
              rows={2}
              className="rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            태그 <span className="text-xs font-normal text-muted-foreground">(쉼표로 구분)</span>
            <input
              type="text"
              name="tags"
              placeholder="예: react, 빌드도구, 컬처핏"
              className="rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          {error === "missing-question" && (
            <p className="text-sm text-danger">질문을 입력해 주세요.</p>
          )}
          <button
            type="submit"
            className="rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            추가
          </button>
        </form>
      </section>
    </AppShell>
  );
}

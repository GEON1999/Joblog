import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Outcome } from "@/lib/db/schema";
import { daysInStage } from "@/lib/domain/days-in-stage";
import { CLOSED_OUTCOMES, OUTCOME_LABELS } from "@/lib/domain/outcome";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { formatDate, formatDateTime } from "@/lib/format";
import { getApplicationDetail } from "@/lib/queries/application-detail";
import { getInterviewsForApplication } from "@/lib/queries/interviews";
import { isUuid } from "@/lib/uuid";

import { closeApplication, reopenApplication } from "../actions";

export const metadata: Metadata = {
  title: "지원 상세 — JobLog",
};

const OUTCOME_BADGE_STYLES: Record<Outcome, string> = {
  in_progress: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  accepted: "bg-green-50 text-green-700",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const detail = await getApplicationDetail(id);
  if (!detail) {
    notFound();
  }

  const { application, companyName, transitions, snapshot } = detail;
  const interviews = await getInterviewsForApplication(application.id);
  const isInProgress = application.outcome === "in_progress";
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← 보드로
      </Link>

      <header className="mt-4">
        <p className="text-sm text-gray-500">{companyName}</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{application.title}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${OUTCOME_BADGE_STYLES[application.outcome]}`}
          >
            {OUTCOME_LABELS[application.outcome]}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {formatDate(application.appliedAt)} 지원 · 현재 단계{" "}
          <span className="font-medium text-gray-700">{STAGE_LABELS[application.stage]}</span>
          {application.closedAt && <> · {formatDate(application.closedAt)} 종료</>}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">단계 이력</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {transitions.map((transition, index) => {
            const nextEnteredAt = transitions[index + 1]?.occurredAt;
            const stageLeftAt = nextEnteredAt ?? application.closedAt ?? now;
            const isCurrent = index === transitions.length - 1 && isInProgress;
            return (
              <li
                key={transition.id}
                className="flex items-baseline justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <span className={isCurrent ? "font-semibold" : ""}>
                  {STAGE_LABELS[transition.toStage]}
                  {isCurrent && <span className="ml-2 text-xs text-blue-600">현재</span>}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(transition.occurredAt)} 진입 ·{" "}
                  {daysInStage(transition.occurredAt, stageLeftAt)}일{isCurrent ? "째" : " 머묾"}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-700">면접</h2>
          <Link
            href={`/applications/${application.id}/interviews/new`}
            className="text-xs text-gray-500 hover:underline"
          >
            면접 추가
          </Link>
        </div>
        {interviews.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">기록된 면접이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <Link
                  href={`/interviews/${interview.id}`}
                  className="flex items-baseline justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium">{interview.round}</span>
                  <span className="text-xs text-gray-500">
                    {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : "일시 미정"}
                    {interview.format && <> · {interview.format}</>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-700">공고 스냅샷</h2>
          <Link
            href={`/applications/${application.id}/snapshot`}
            className="text-xs text-gray-500 hover:underline"
          >
            {snapshot ? "수정" : "원문 붙여넣기"}
          </Link>
        </div>
        {snapshot ? (
          <>
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(snapshot.capturedAt)} 저장
              {snapshot.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={snapshot.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    원본 링크
                  </a>
                </>
              )}
            </p>
            <pre className="mt-3 max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-xs whitespace-pre-wrap text-gray-700">
              {snapshot.content}
            </pre>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            공고 원문이 저장되지 않았습니다. 공고가 내려가기 전에 붙여넣어 두세요.
          </p>
        )}
      </section>

      <section className="mt-8">
        {isInProgress ? (
          <>
            <h2 className="text-sm font-semibold text-gray-700">종료 처리</h2>
            <p className="mt-1 text-xs text-gray-500">
              종료해도 마지막 단계({STAGE_LABELS[application.stage]})는 기록으로 남습니다.
            </p>
            <div className="mt-3 flex gap-2">
              {CLOSED_OUTCOMES.map((outcome) => (
                <form
                  key={outcome}
                  action={async () => {
                    "use server";
                    await closeApplication(application.id, outcome);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    {OUTCOME_LABELS[outcome]}
                  </button>
                </form>
              ))}
            </div>
          </>
        ) : (
          <form
            action={async () => {
              "use server";
              await reopenApplication(application.id);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              진행중으로 재개
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

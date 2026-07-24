import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { notFound } from "next/navigation";

import type { Outcome } from "@/lib/db/schema";
import { daysInStage } from "@/lib/domain/days-in-stage";
import { CLOSED_OUTCOMES, OUTCOME_LABELS } from "@/lib/domain/outcome";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { formatDate, formatDateTime } from "@/lib/format";
import { NEXT_ACTION_KIND_LABELS, NEXT_ACTION_KINDS } from "@/lib/domain/next-action";
import { getApplicationDetail } from "@/lib/queries/application-detail";
import { getDocumentsForApplication, getUnlinkedDocuments } from "@/lib/queries/documents";
import { getInterviewsForApplication } from "@/lib/queries/interviews";
import { getNextActionsForApplication } from "@/lib/queries/next-actions";
import { getOfferForApplication } from "@/lib/queries/offers";
import { isUuid } from "@/lib/uuid";

import { DocumentsSection } from "@/components/document/documents-section";
import { OfferSection } from "@/components/offer/offer-section";
import { createNextAction, toggleNextActionDone } from "@/app/next-actions/actions";

import { closeApplication, reopenApplication } from "../actions";

export const metadata: Metadata = {
  title: "지원 상세 — JobLog",
};

const OUTCOME_BADGE_STYLES: Record<Outcome, string> = {
  in_progress: "bg-accent text-accent-foreground",
  rejected: "bg-danger-bg text-danger",
  withdrawn: "bg-surface-muted text-muted-foreground",
  accepted: "bg-success-bg text-success",
};

const ACTION_ERROR_MESSAGES: Record<string, string> = {
  "missing-action-title": "액션 제목을 입력해 주세요.",
  "invalid-action-kind": "액션 종류가 올바르지 않습니다.",
  "invalid-action-due": "기한 형식이 올바르지 않습니다.",
};

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) {
    notFound();
  }

  const [detail, interviews, actions, offer, linkedDocuments, unlinkedDocuments] =
    await Promise.all([
      getApplicationDetail(id),
      getInterviewsForApplication(id),
      getNextActionsForApplication(id),
      getOfferForApplication(id),
      getDocumentsForApplication(id),
      getUnlinkedDocuments(id),
    ]);
  if (!detail) {
    notFound();
  }

  const { application, companyName, transitions, snapshot } = detail;
  const isInProgress = application.outcome === "in_progress";
  const now = new Date();
  const actionError = error ? ACTION_ERROR_MESSAGES[error] : undefined;

  return (
    <AppShell>
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 보드로
      </Link>

      <header className="mt-4">
        <p className="text-sm text-muted-foreground">{companyName}</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{application.title}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${OUTCOME_BADGE_STYLES[application.outcome]}`}
          >
            {OUTCOME_LABELS[application.outcome]}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(application.appliedAt)} 지원 · 현재 단계{" "}
          <span className="font-medium text-foreground">{STAGE_LABELS[application.stage]}</span>
          {application.closedAt && <> · {formatDate(application.closedAt)} 종료</>}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">단계 이력</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {transitions.map((transition, index) => {
            const nextEnteredAt = transitions[index + 1]?.occurredAt;
            const stageLeftAt = nextEnteredAt ?? application.closedAt ?? now;
            const isCurrent = index === transitions.length - 1 && isInProgress;
            return (
              <li
                key={transition.id}
                className="flex items-baseline justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className={isCurrent ? "font-semibold" : ""}>
                  {STAGE_LABELS[transition.toStage]}
                  {isCurrent && <span className="ml-2 text-xs text-primary">현재</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(transition.occurredAt)} 진입 ·{" "}
                  {daysInStage(transition.occurredAt, stageLeftAt)}일{isCurrent ? "째" : " 머묾"}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">다음 액션</h2>
        {actions.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {actions.map((action) => {
              const isDone = action.doneAt !== null;
              const isOverdue = !isDone && action.dueAt < now;
              return (
                <li
                  key={action.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className={isDone ? "text-muted-foreground line-through" : ""}>
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {NEXT_ACTION_KIND_LABELS[action.kind]}
                    </span>{" "}
                    {action.title}
                    <span
                      className={`ml-2 text-xs ${isOverdue ? "font-medium text-danger" : "text-muted-foreground"}`}
                    >
                      {formatDateTime(action.dueAt)}
                      {isOverdue && " · 지남"}
                    </span>
                  </span>
                  <form action={toggleNextActionDone.bind(null, action.id, application.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                    >
                      {isDone ? "되돌리기" : "완료"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form
          action={createNextAction.bind(null, application.id)}
          className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-surface-muted p-3"
        >
          <div className="flex gap-2">
            <select
              name="kind"
              defaultValue="follow_up"
              className="rounded-md border border-border bg-input px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              {NEXT_ACTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {NEXT_ACTION_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              name="dueAt"
              required
              className="rounded-md border border-border bg-input px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </div>
          <input
            type="text"
            name="title"
            required
            placeholder="예: 1차 면접, 과제 제출, 팔로업 메일"
            className="rounded-md border border-border bg-input px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
          {actionError && <p className="text-sm text-danger">{actionError}</p>}
          <button
            type="submit"
            className="self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            액션 추가
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">면접</h2>
          <Link
            href={`/applications/${application.id}/interviews/new`}
            className="text-xs text-muted-foreground hover:underline"
          >
            면접 추가
          </Link>
        </div>
        {interviews.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">기록된 면접이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <Link
                  href={`/interviews/${interview.id}`}
                  className="flex items-baseline justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <span className="font-medium">{interview.round}</span>
                  <span className="text-xs text-muted-foreground">
                    {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : "일시 미정"}
                    {interview.format && <> · {interview.format}</>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DocumentsSection
        applicationId={application.id}
        linked={linkedDocuments}
        unlinked={unlinkedDocuments}
      />

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">공고 스냅샷</h2>
          <Link
            href={`/applications/${application.id}/snapshot`}
            className="text-xs text-muted-foreground hover:underline"
          >
            {snapshot ? "수정" : "원문 붙여넣기"}
          </Link>
        </div>
        {snapshot ? (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
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
            <pre className="mt-3 max-h-96 overflow-y-auto rounded-md border border-border bg-surface-muted p-4 text-xs whitespace-pre-wrap text-foreground">
              {snapshot.content}
            </pre>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            공고 원문이 저장되지 않았습니다. 공고가 내려가기 전에 붙여넣어 두세요.
          </p>
        )}
      </section>

      {application.stage === "offer" && (
        <OfferSection applicationId={application.id} offer={offer} error={error} />
      )}

      <section className="mt-8">
        {isInProgress ? (
          <>
            <h2 className="text-sm font-semibold text-foreground">종료 처리</h2>
            <p className="mt-1 text-xs text-muted-foreground">
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
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
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
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
            >
              진행중으로 재개
            </button>
          </form>
        )}
      </section>
    </AppShell>
  );
}

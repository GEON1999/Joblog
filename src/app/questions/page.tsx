import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Badge, EmptyState, PageHeader } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/format";
import { getQuestionBank } from "@/lib/queries/interviews";

export const metadata: Metadata = {
  title: "질문 은행 — JobLog",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const user = await requireUser();
  const entries = await getQuestionBank(
    {
      keyword: q?.trim() || undefined,
      tag: tag?.trim() || undefined,
    },
    user.id,
  );

  return (
    <AppShell>
      <PageHeader
        title="질문 은행"
        description={`모든 면접에서 받은 질문 ${entries.length}개. 다음 면접 대비 자산입니다.`}
        back={{ href: "/", label: "보드로" }}
      />

      <form method="GET" className="flex gap-2">
        <Input type="search" name="q" defaultValue={q ?? ""} placeholder="질문 검색" />
        <Button type="submit" className="shrink-0">
          검색
        </Button>
      </form>

      {tag && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Badge tone="brand">{tag}</Badge> 필터 중 ·{" "}
          <Link href="/questions" className="text-xs hover:text-foreground hover:underline">
            해제
          </Link>
        </p>
      )}

      {entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState>
            {q || tag ? "조건에 맞는 질문이 없습니다." : "아직 기록된 질문이 없습니다."}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map(({ question, interviewId, round, companyName }) => (
            <li key={question.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold">{question.question}</p>
              {question.preparedAnswer && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold">준비한 답변</span> · {question.preparedAnswer}
                </p>
              )}
              <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Link
                  href={`/interviews/${interviewId}`}
                  className="hover:text-foreground hover:underline"
                >
                  {companyName} · {round}
                </Link>
                <span>· {formatDate(question.createdAt)}</span>
                {question.tags.map((questionTag) => (
                  <Link
                    key={questionTag}
                    href={`/questions?tag=${encodeURIComponent(questionTag)}`}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {questionTag}
                  </Link>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/layout";
import { OUTCOME_LABELS } from "@/lib/domain/outcome";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { requireUser } from "@/lib/auth/require-user";
import { formatDate } from "@/lib/format";
import { getArchivedApplications } from "@/lib/queries/application-detail";

export const metadata: Metadata = {
  title: "아카이브 — JobLog",
};

// 쿠키/파라미터를 읽지 않는 페이지라 정적 프리렌더 대상이 된다 —
// 빌드 시점 DB 접근(CI엔 env가 없다)과 stale 목록을 막기 위해 명시적으로 동적 렌더
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const user = await requireUser();
  const archived = await getArchivedApplications(user.id);

  return (
    <AppShell>
      <PageHeader
        title="아카이브"
        description="종료된 지원을 마지막 단계와 결과로 되돌아봅니다."
        back={{ href: "/", label: "보드로" }}
      />

      {archived.length === 0 ? (
        <EmptyState>종료된 지원이 없습니다.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {archived.map((item) => (
            <li key={item.id}>
              <Link
                href={`/applications/${item.id}`}
                className="flex items-baseline justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-ring/40 hover:bg-surface-muted"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">{item.companyName}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold">{item.title}</span>
                </span>
                <span className="ml-4 shrink-0 text-right text-xs text-muted-foreground">
                  <span className="block">
                    {STAGE_LABELS[item.stage]}에서 {OUTCOME_LABELS[item.outcome]}
                  </span>
                  {item.closedAt && (
                    <span className="mt-0.5 block">{formatDate(item.closedAt)}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

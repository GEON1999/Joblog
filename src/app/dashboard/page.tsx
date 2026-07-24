import type { Metadata } from "next";
import Link from "next/link";

import { ConversionRateChart, StageStatusChart } from "@/components/dashboard/funnel-charts";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui/layout";
import { NEXT_ACTION_KIND_LABELS } from "@/lib/domain/next-action";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { formatDateTime } from "@/lib/format";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getPendingActions } from "@/lib/queries/next-actions";

export const metadata: Metadata = {
  title: "대시보드 — JobLog",
};

export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const [{ totals, funnel }, pendingActions] = await Promise.all([
    getDashboardData(),
    getPendingActions(),
  ]);
  const now = new Date();

  return (
    <AppShell width="wide">
      <PageHeader
        title="대시보드"
        description="단계별 전환율로 어디서 막히는지 데이터로 봅니다."
        back={{ href: "/", label: "보드로" }}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="총 지원" value={totals.all} />
        <StatTile label="진행중" value={totals.inProgress} />
        <StatTile label="종료" value={totals.closed} />
        <StatTile label="수락" value={totals.accepted} />
      </section>

      <section className="mt-8">
        <SectionTitle>다가오는 액션</SectionTitle>
        {pendingActions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">예정된 액션이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {pendingActions.map(({ action, applicationId, applicationTitle, companyName }) => {
              const isOverdue = action.dueAt < now;
              return (
                <li key={action.id}>
                  <Link
                    href={`/applications/${applicationId}`}
                    className="flex items-baseline justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm transition-colors hover:border-ring/40 hover:bg-surface-muted"
                  >
                    <span className="flex items-baseline gap-1.5">
                      <Badge>{NEXT_ACTION_KIND_LABELS[action.kind]}</Badge>
                      {action.title}
                      <span className="text-xs text-muted-foreground">
                        · {companyName} · {applicationTitle}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs ${isOverdue ? "font-semibold text-danger" : "text-muted-foreground"}`}
                    >
                      {formatDateTime(action.dueAt)}
                      {isOverdue && " · 지남"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle>단계별 전환율</SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          결판난 건만 분모에 넣습니다 (다음 단계로 넘어간 건 + 그 단계에서 종료된 건). 결과 대기
          중인 지원은 아래 현황 차트의 대기로 표시됩니다.
        </p>
        <Card className="mt-4">
          <ConversionRateChart funnel={funnel} />
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>단계별 현황</SectionTitle>
        <Card className="mt-4">
          <StageStatusChart funnel={funnel} />
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>단계별 상세</SectionTitle>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">단계</th>
                <th className="p-3 text-right font-medium">통과</th>
                <th className="p-3 text-right font-medium">종료</th>
                <th className="p-3 text-right font-medium">대기</th>
                <th className="p-3 text-right font-medium">전환율</th>
                <th className="p-3 text-right font-medium">평균 체류</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {funnel.map((row) => (
                <tr key={row.stage} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{STAGE_LABELS[row.stage]}</td>
                  <td className="p-3 text-right">{row.passed}</td>
                  <td className="p-3 text-right">{row.ended}</td>
                  <td className="p-3 text-right">{row.waiting}</td>
                  <td className="p-3 text-right">
                    {row.rate === null ? "—" : `${Math.round(row.rate * 100)}%`}
                  </td>
                  <td className="p-3 text-right">
                    {row.avgDwellDays === null ? "—" : `${row.avgDwellDays.toFixed(1)}일`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

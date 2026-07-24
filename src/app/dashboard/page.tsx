import type { Metadata } from "next";
import Link from "next/link";

import { ConversionRateChart, StageStatusChart } from "@/components/dashboard/funnel-charts";
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
    <div className="rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [{ totals, funnel }, pendingActions] = await Promise.all([
    getDashboardData(),
    getPendingActions(),
  ]);
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">대시보드</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 보드로
        </Link>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="총 지원" value={totals.all} />
        <StatTile label="진행중" value={totals.inProgress} />
        <StatTile label="종료" value={totals.closed} />
        <StatTile label="수락" value={totals.accepted} />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">다가오는 액션</h2>
        {pendingActions.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">예정된 액션이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {pendingActions.map(({ action, applicationId, applicationTitle, companyName }) => {
              const isOverdue = action.dueAt < now;
              return (
                <li key={action.id}>
                  <Link
                    href={`/applications/${applicationId}`}
                    className="flex items-baseline justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {NEXT_ACTION_KIND_LABELS[action.kind]}
                      </span>{" "}
                      {action.title}
                      <span className="ml-1 text-xs text-gray-400">
                        · {companyName} · {applicationTitle}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs ${isOverdue ? "font-medium text-red-600" : "text-gray-500"}`}
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
        <h2 className="text-sm font-semibold text-gray-700">단계별 전환율</h2>
        <p className="mt-1 text-xs text-gray-500">
          결판난 건만 분모에 넣습니다 (다음 단계로 넘어간 건 + 그 단계에서 종료된 건). 결과 대기
          중인 지원은 아래 현황 차트의 대기로 표시됩니다.
        </p>
        <div className="mt-4">
          <ConversionRateChart funnel={funnel} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">단계별 현황</h2>
        <div className="mt-4">
          <StageStatusChart funnel={funnel} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">단계별 상세</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="py-2 font-medium">단계</th>
              <th className="py-2 text-right font-medium">통과</th>
              <th className="py-2 text-right font-medium">종료</th>
              <th className="py-2 text-right font-medium">대기</th>
              <th className="py-2 text-right font-medium">전환율</th>
              <th className="py-2 text-right font-medium">평균 체류</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {funnel.map((row) => (
              <tr key={row.stage} className="border-b border-gray-100">
                <td className="py-2">{STAGE_LABELS[row.stage]}</td>
                <td className="py-2 text-right">{row.passed}</td>
                <td className="py-2 text-right">{row.ended}</td>
                <td className="py-2 text-right">{row.waiting}</td>
                <td className="py-2 text-right">
                  {row.rate === null ? "—" : `${Math.round(row.rate * 100)}%`}
                </td>
                <td className="py-2 text-right">
                  {row.avgDwellDays === null ? "—" : `${row.avgDwellDays.toFixed(1)}일`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

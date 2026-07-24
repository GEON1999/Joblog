import type { Metadata } from "next";
import Link from "next/link";

import { ConversionRateChart, StageStatusChart } from "@/components/dashboard/funnel-charts";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { getDashboardData } from "@/lib/queries/dashboard";

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
  const { totals, funnel } = await getDashboardData();

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

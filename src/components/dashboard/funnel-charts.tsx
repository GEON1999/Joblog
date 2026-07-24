"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StageFunnel } from "@/lib/domain/funnel";
import { STAGE_LABELS } from "@/lib/domain/stage";

// 계열 색은 브랜드 틸(통과) + 앰버(종료) + 중립 슬레이트(대기). 대비 relief는 하단 상세 테이블.
// 그리드·축은 CSS 토큰을 참조해 라이트/다크에 자동으로 맞춘다.
const COLORS = {
  passed: "#0d9488", // teal (brand)
  ended: "#f59e0b", // amber
  waiting: "#94a3b8", // slate (중립 — '대기')
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
  gap: "var(--surface)", // 스택 세그먼트 사이 표면색 간격
};

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

export function ConversionRateChart({ funnel }: { funnel: StageFunnel[] }) {
  const data = funnel
    .filter((row) => row.stage !== "offer") // 오퍼는 다음 단계가 없어 전환율이 정의되지 않는다
    .map((row) => ({
      name: STAGE_LABELS[row.stage],
      rate: row.rate === null ? null : Math.round(row.rate * 100),
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLORS.axis, fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLORS.axis, fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "전환율"]}
          cursor={{ fill: "var(--surface-muted)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Bar dataKey="rate" fill={COLORS.passed} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StageStatusChart({ funnel }: { funnel: StageFunnel[] }) {
  const data = funnel.map((row) => ({
    name: STAGE_LABELS[row.stage],
    통과: row.passed,
    종료: row.ended,
    대기: row.waiting,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLORS.axis, fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: COLORS.axis, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-muted)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {/* 색은 계열(엔티티)에 고정 — 통과/종료/대기 순서의 카테고리 슬롯 1~3.
            세그먼트 사이 2px 흰 스트로크로 인접 색을 분리한다 */}
        <Bar
          dataKey="통과"
          stackId="status"
          fill={COLORS.passed}
          stroke={COLORS.gap}
          strokeWidth={2}
          maxBarSize={48}
        />
        <Bar
          dataKey="종료"
          stackId="status"
          fill={COLORS.ended}
          stroke={COLORS.gap}
          strokeWidth={2}
          maxBarSize={48}
        />
        <Bar
          dataKey="대기"
          stackId="status"
          fill={COLORS.waiting}
          stroke={COLORS.gap}
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

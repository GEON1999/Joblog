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

// dataviz 검증 통과 팔레트 (light, white surface) — 카테고리 슬롯 1~3 고정 순서
const COLORS = {
  passed: "#2a78d6", // blue
  ended: "#eb6834", // orange
  waiting: "#1baf7a", // aqua — 대비 3:1 미만이라 테이블 뷰(relief)를 함께 제공한다
  grid: "#e1e0d9",
  axis: "#898781",
};

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
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
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
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {/* 색은 계열(엔티티)에 고정 — 통과/종료/대기 순서의 카테고리 슬롯 1~3.
            세그먼트 사이 2px 흰 스트로크로 인접 색을 분리한다 */}
        <Bar
          dataKey="통과"
          stackId="status"
          fill={COLORS.passed}
          stroke="#ffffff"
          strokeWidth={2}
          maxBarSize={48}
        />
        <Bar
          dataKey="종료"
          stackId="status"
          fill={COLORS.ended}
          stroke="#ffffff"
          strokeWidth={2}
          maxBarSize={48}
        />
        <Bar
          dataKey="대기"
          stackId="status"
          fill={COLORS.waiting}
          stroke="#ffffff"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

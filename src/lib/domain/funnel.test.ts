import { describe, expect, it } from "vitest";

import type { Outcome, Stage } from "@/lib/db/schema";

import { computeFunnel, type FunnelApplication, type FunnelTransition } from "./funnel";

let sequence = 0;

function app(stage: Stage, outcome: Outcome, closedAt: Date | null = null): FunnelApplication {
  sequence += 1;
  return { id: `app-${sequence}`, stage, outcome, closedAt };
}

function transition(
  applicationId: string,
  fromStage: Stage | null,
  toStage: Stage,
  occurredAt: string,
): FunnelTransition {
  return { applicationId, fromStage, toStage, occurredAt: new Date(occurredAt) };
}

function stageOf(result: ReturnType<typeof computeFunnel>, stage: Stage) {
  const found = result.find((row) => row.stage === stage);
  if (!found) throw new Error(`missing stage ${stage}`);
  return found;
}

describe("computeFunnel", () => {
  it("대기 중인 지원은 분모에서 제외한다 — 통과 3, 탈락 2, 대기 5면 60%", () => {
    const apps = [
      // 서류를 통과해 면접까지 간 3건
      ...Array.from({ length: 3 }, () => app("interview", "in_progress")),
      // 서류에서 탈락한 2건
      ...Array.from({ length: 2 }, () => app("screening", "rejected", new Date())),
      // 서류 결과 대기 중 5건
      ...Array.from({ length: 5 }, () => app("screening", "in_progress")),
    ];
    const passedTransitions = apps
      .slice(0, 3)
      .map((a) => transition(a.id, "screening", "interview", "2026-07-20T09:00:00+09:00"));

    const result = computeFunnel(apps, passedTransitions);
    const screening = stageOf(result, "screening");

    expect(screening.passed).toBe(3);
    expect(screening.ended).toBe(2);
    expect(screening.waiting).toBe(5);
    expect(screening.rate).toBeCloseTo(0.6);
  });

  it("결판난 건이 없으면 전환율은 0%가 아니라 null이다", () => {
    const waiting = app("applied", "in_progress");
    const result = computeFunnel([waiting], []);
    expect(stageOf(result, "applied").rate).toBeNull();
    expect(stageOf(result, "applied").waiting).toBe(1);
  });

  it("뒤로 이동은 통과로 세지 않는다", () => {
    const moved = app("screening", "in_progress");
    const result = computeFunnel(
      [moved],
      [transition(moved.id, "interview", "screening", "2026-07-20T09:00:00+09:00")],
    );
    expect(stageOf(result, "interview").passed).toBe(0);
  });

  it("한 지원이 같은 단계를 두 번 통과해도 한 번으로 센다", () => {
    const bounced = app("assignment", "in_progress");
    const result = computeFunnel(
      [bounced],
      [
        transition(bounced.id, "screening", "assignment", "2026-07-18T09:00:00+09:00"),
        transition(bounced.id, "assignment", "screening", "2026-07-19T09:00:00+09:00"),
        transition(bounced.id, "screening", "assignment", "2026-07-21T09:00:00+09:00"),
      ],
    );
    expect(stageOf(result, "screening").passed).toBe(1);
  });

  it("평균 체류는 완결된 구간만 센다 — 진행 중 구간은 제외", () => {
    const ongoing = app("screening", "in_progress");
    const result = computeFunnel(
      [ongoing],
      [
        transition(ongoing.id, null, "applied", "2026-07-10T09:00:00+09:00"),
        // applied에 7/10~7/12 사흘 머묾(완결), screening은 진행 중이라 제외
        transition(ongoing.id, "applied", "screening", "2026-07-12T09:00:00+09:00"),
      ],
    );
    expect(stageOf(result, "applied").avgDwellDays).toBe(3);
    expect(stageOf(result, "screening").avgDwellDays).toBeNull();
  });

  it("종료된 지원의 마지막 단계 체류는 closedAt으로 완결된다", () => {
    const rejected = app("screening", "rejected", new Date("2026-07-15T09:00:00+09:00"));
    const result = computeFunnel(
      [rejected],
      [
        transition(rejected.id, null, "applied", "2026-07-10T09:00:00+09:00"),
        transition(rejected.id, "applied", "screening", "2026-07-11T09:00:00+09:00"),
      ],
    );
    // 7/11 진입 → 7/15 종료 = 5일
    expect(stageOf(result, "screening").avgDwellDays).toBe(5);
  });
});

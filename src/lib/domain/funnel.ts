import type { Outcome, Stage } from "@/lib/db/schema";

import { daysInStage } from "./days-in-stage";
import { STAGES } from "./stage";

export interface FunnelApplication {
  id: string;
  stage: Stage;
  outcome: Outcome;
  closedAt: Date | null;
}

export interface FunnelTransition {
  applicationId: string;
  fromStage: Stage | null;
  toStage: Stage;
  occurredAt: Date;
}

export interface StageFunnel {
  stage: Stage;
  /** 이 단계를 지나 다음 단계로 넘어간 지원 수 */
  passed: number;
  /** 이 단계에서 종료(탈락·철회·수락)된 지원 수 */
  ended: number;
  /** 이 단계에서 결과를 기다리는 중인 지원 수 */
  waiting: number;
  /** 전환율 = passed / (passed + ended). 결판난 건이 없으면 null — CONTEXT.md */
  rate: number | null;
  /** 완결된 체류 구간의 평균 일수. 구간이 없으면 null */
  avgDwellDays: number | null;
}

function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/**
 * 단계별 퍼널 지표를 계산한다. 대기 중인 지원은 분모에서 제외한다 —
 * 넣으면 지원 직후일수록 통과율이 실제보다 낮게 왜곡된다.
 * 뒤로 이동(실수 복구)은 통과로 세지 않는다.
 */
export function computeFunnel(
  applications: FunnelApplication[],
  transitions: FunnelTransition[],
): StageFunnel[] {
  // 단계별로 "이 단계에서 순방향으로 빠져나간 지원" 집합
  const passedByStage = new Map<Stage, Set<string>>(STAGES.map((stage) => [stage, new Set()]));
  for (const transition of transitions) {
    if (
      transition.fromStage !== null &&
      stageIndex(transition.toStage) > stageIndex(transition.fromStage)
    ) {
      passedByStage.get(transition.fromStage)?.add(transition.applicationId);
    }
  }

  // 단계별 체류 구간(진입 → 다음 전환 또는 종료 시각) 수집
  const transitionsByApplication = new Map<string, FunnelTransition[]>();
  for (const transition of transitions) {
    const list = transitionsByApplication.get(transition.applicationId) ?? [];
    list.push(transition);
    transitionsByApplication.set(transition.applicationId, list);
  }
  const closedAtById = new Map(applications.map((app) => [app.id, app.closedAt]));

  const dwellByStage = new Map<Stage, number[]>(STAGES.map((stage) => [stage, []]));
  for (const [applicationId, list] of transitionsByApplication) {
    const ordered = [...list].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    ordered.forEach((transition, index) => {
      const exitAt = ordered[index + 1]?.occurredAt ?? closedAtById.get(applicationId) ?? null;
      if (exitAt) {
        dwellByStage.get(transition.toStage)?.push(daysInStage(transition.occurredAt, exitAt));
      }
    });
  }

  return STAGES.map((stage) => {
    const passed = passedByStage.get(stage)?.size ?? 0;
    const ended = applications.filter(
      (app) => app.stage === stage && app.outcome !== "in_progress",
    ).length;
    const waiting = applications.filter(
      (app) => app.stage === stage && app.outcome === "in_progress",
    ).length;
    const decided = passed + ended;
    const dwells = dwellByStage.get(stage) ?? [];

    return {
      stage,
      passed,
      ended,
      waiting,
      rate: decided > 0 ? passed / decided : null,
      avgDwellDays:
        dwells.length > 0 ? dwells.reduce((sum, days) => sum + days, 0) / dwells.length : null,
    };
  });
}

import type { Outcome, Stage } from "@/lib/db/schema";

export type StageMoveValidation =
  { ok: true } | { ok: false; reason: "not-in-progress" | "same-stage" };

/**
 * 단계 이동 규칙. 진행중인 지원만 움직일 수 있고, 같은 단계로의 이동은 없다.
 * 방향 제한은 두지 않는다 — 실수 복구를 위해 뒤로 이동도 허용하며, 어차피 전환 기록이 남는다.
 */
export function validateStageMove(
  outcome: Outcome,
  fromStage: Stage,
  toStage: Stage,
): StageMoveValidation {
  if (outcome !== "in_progress") {
    return { ok: false, reason: "not-in-progress" };
  }
  if (fromStage === toStage) {
    return { ok: false, reason: "same-stage" };
  }
  return { ok: true };
}

import type { Outcome } from "@/lib/db/schema";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  in_progress: "진행중",
  rejected: "탈락",
  withdrawn: "철회",
  accepted: "수락",
};

// 종료를 의미하는 Outcome — in_progress를 제외한 전부
export const CLOSED_OUTCOMES = ["rejected", "withdrawn", "accepted"] as const;

export type ClosedOutcome = (typeof CLOSED_OUTCOMES)[number];

export type CloseValidation =
  { ok: true } | { ok: false; reason: "invalid-outcome" | "already-closed" };

/** 종료 규칙: 진행중인 지원만, 종료형 Outcome으로만 닫을 수 있다 */
export function validateClose(current: Outcome, to: Outcome): CloseValidation {
  if (!(CLOSED_OUTCOMES as readonly Outcome[]).includes(to)) {
    return { ok: false, reason: "invalid-outcome" };
  }
  if (current !== "in_progress") {
    return { ok: false, reason: "already-closed" };
  }
  return { ok: true };
}

export type ReopenValidation = { ok: true } | { ok: false; reason: "not-closed" };

/** 재개 규칙: 종료된 지원만 진행중으로 되돌릴 수 있다 (실수 복구) */
export function validateReopen(current: Outcome): ReopenValidation {
  if (current === "in_progress") {
    return { ok: false, reason: "not-closed" };
  }
  return { ok: true };
}

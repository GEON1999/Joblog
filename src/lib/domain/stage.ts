import type { Stage } from "@/lib/db/schema";

// 칸반 컬럼 순서와 동일하다 — CONTEXT.md의 Stage 정의
export const STAGES: readonly Stage[] = [
  "applied",
  "screening",
  "assignment",
  "interview",
  "offer",
];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "지원함",
  screening: "서류",
  assignment: "과제",
  interview: "면접",
  offer: "오퍼",
};

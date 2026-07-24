import type { NextActionKind } from "@/lib/db/schema";

export const NEXT_ACTION_KINDS: readonly NextActionKind[] = [
  "interview",
  "assignment_due",
  "follow_up",
  "other",
];

export const NEXT_ACTION_KIND_LABELS: Record<NextActionKind, string> = {
  interview: "면접 일정",
  assignment_due: "과제 마감",
  follow_up: "팔로업",
  other: "기타",
};

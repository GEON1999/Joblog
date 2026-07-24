import { describe, expect, it } from "vitest";

import { FOLLOW_UP_THRESHOLD_DAYS, needsFollowUp } from "./follow-up";

const base = {
  isInProgress: true,
  stageEnteredAt: new Date("2026-07-01T09:00:00+09:00"),
  now: new Date("2026-07-20T09:00:00+09:00"), // 20일째, 기준 초과
  hasPendingAction: false,
};

describe("needsFollowUp", () => {
  it("진행중 + 오래 체류 + 액션 없음이면 팔로업 필요", () => {
    expect(needsFollowUp(base)).toBe(true);
  });

  it("미완료 액션이 있으면 팔로업 불필요", () => {
    expect(needsFollowUp({ ...base, hasPendingAction: true })).toBe(false);
  });

  it("종료된 지원은 팔로업 대상이 아니다", () => {
    expect(needsFollowUp({ ...base, isInProgress: false })).toBe(false);
  });

  it("기준일 이하로 체류하면 아직 팔로업 불필요", () => {
    const enteredAt = new Date("2026-07-20T09:00:00+09:00");
    // 정확히 기준일째(초과 아님)
    const now = new Date(enteredAt);
    now.setDate(now.getDate() + (FOLLOW_UP_THRESHOLD_DAYS - 1));
    expect(needsFollowUp({ ...base, stageEnteredAt: enteredAt, now })).toBe(false);
  });
});

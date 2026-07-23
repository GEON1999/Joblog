import { describe, expect, it } from "vitest";

import { daysInStage } from "./days-in-stage";

describe("daysInStage", () => {
  it("진입 당일은 1일째다", () => {
    const enteredAt = new Date("2026-07-23T01:00:00+09:00");
    const now = new Date("2026-07-23T23:00:00+09:00");
    expect(daysInStage(enteredAt, now)).toBe(1);
  });

  it("다음날이면 시간과 무관하게 2일째다", () => {
    const enteredAt = new Date("2026-07-22T23:59:00+09:00");
    const now = new Date("2026-07-23T00:01:00+09:00");
    expect(daysInStage(enteredAt, now)).toBe(2);
  });

  it("KST 날짜 경계는 UTC가 아니라 한국 시간 기준이다", () => {
    // UTC로는 같은 날(22일 14:59/15:01)이지만 KST로는 22일 23:59 → 23일 00:01
    const enteredAt = new Date("2026-07-22T14:59:00Z");
    const now = new Date("2026-07-22T15:01:00Z");
    expect(daysInStage(enteredAt, now)).toBe(2);
  });

  it("열흘 지나면 11일째다", () => {
    const enteredAt = new Date("2026-07-13T09:00:00+09:00");
    const now = new Date("2026-07-23T09:00:00+09:00");
    expect(daysInStage(enteredAt, now)).toBe(11);
  });

  it("클럭 스큐로 진입 시각이 미래여도 1일째로 고정된다", () => {
    const enteredAt = new Date("2026-07-24T00:00:00+09:00");
    const now = new Date("2026-07-23T23:00:00+09:00");
    expect(daysInStage(enteredAt, now)).toBe(1);
  });
});

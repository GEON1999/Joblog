import { describe, expect, it } from "vitest";

import { validateClose, validateReopen } from "./outcome";

describe("validateClose", () => {
  it("진행중인 지원은 종료형 Outcome으로 닫을 수 있다", () => {
    expect(validateClose("in_progress", "rejected")).toEqual({ ok: true });
    expect(validateClose("in_progress", "withdrawn")).toEqual({ ok: true });
    expect(validateClose("in_progress", "accepted")).toEqual({ ok: true });
  });

  it("in_progress로의 종료는 거부된다", () => {
    expect(validateClose("in_progress", "in_progress")).toEqual({
      ok: false,
      reason: "invalid-outcome",
    });
  });

  it("이미 종료된 지원은 다시 닫을 수 없다", () => {
    expect(validateClose("rejected", "accepted")).toEqual({
      ok: false,
      reason: "already-closed",
    });
  });
});

describe("validateReopen", () => {
  it("종료된 지원은 재개할 수 있다", () => {
    expect(validateReopen("rejected")).toEqual({ ok: true });
  });

  it("진행중인 지원은 재개 대상이 아니다", () => {
    expect(validateReopen("in_progress")).toEqual({ ok: false, reason: "not-closed" });
  });
});

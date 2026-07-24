import { describe, expect, it } from "vitest";

import { validateStageMove } from "./stage-move";

describe("validateStageMove", () => {
  it("진행중인 지원은 다른 단계로 이동할 수 있다", () => {
    expect(validateStageMove("in_progress", "applied", "screening")).toEqual({ ok: true });
  });

  it("뒤로 이동도 허용된다 (실수 복구)", () => {
    expect(validateStageMove("in_progress", "interview", "screening")).toEqual({ ok: true });
  });

  it("종료된 지원은 이동할 수 없다", () => {
    expect(validateStageMove("rejected", "screening", "interview")).toEqual({
      ok: false,
      reason: "not-in-progress",
    });
  });

  it("같은 단계로의 이동은 거부된다", () => {
    expect(validateStageMove("in_progress", "applied", "applied")).toEqual({
      ok: false,
      reason: "same-stage",
    });
  });
});

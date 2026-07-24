import { describe, expect, it } from "vitest";

import { parseTags } from "./tags";

describe("parseTags", () => {
  it("쉼표로 구분하고 공백을 정리한다", () => {
    expect(parseTags("react, pnpm ,  네트워크")).toEqual(["react", "pnpm", "네트워크"]);
  });

  it("빈 항목과 중복을 제거한다", () => {
    expect(parseTags("react,,react, ,pnpm")).toEqual(["react", "pnpm"]);
  });

  it("빈 입력은 빈 배열이다", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("  ,  ")).toEqual([]);
  });
});

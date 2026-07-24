import { describe, expect, it } from "vitest";

import { parseKstDateTime } from "./kst-datetime";

describe("parseKstDateTime", () => {
  it("입력을 KST로 해석한다 — KST 14:00은 UTC 05:00이다", () => {
    const date = parseKstDateTime("2026-07-24T14:00");
    expect(date?.toISOString()).toBe("2026-07-24T05:00:00.000Z");
  });

  it("형식이 다르면 null", () => {
    expect(parseKstDateTime("2026-07-24")).toBeNull();
    expect(parseKstDateTime("not-a-date")).toBeNull();
    expect(parseKstDateTime("")).toBeNull();
  });

  it("존재하지 않는 시각은 null", () => {
    expect(parseKstDateTime("2026-13-99T99:99")).toBeNull();
  });
});

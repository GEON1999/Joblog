import { describe, expect, it } from "vitest";

import { buildIcsCalendar } from "./ics";

const generatedAt = new Date("2026-07-24T00:00:00Z");

describe("buildIcsCalendar", () => {
  it("빈 목록도 유효한 VCALENDAR를 만든다", () => {
    const ics = buildIcsCalendar([], generatedAt);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("시각을 UTC YYYYMMDDTHHMMSSZ로 쓴다", () => {
    const ics = buildIcsCalendar(
      [{ uid: "a@joblog", title: "면접", start: new Date("2026-07-25T05:00:00Z") }],
      generatedAt,
    );
    expect(ics).toContain("DTSTART:20260725T050000Z");
    // 종료 미지정 시 1시간 후
    expect(ics).toContain("DTEND:20260725T060000Z");
  });

  it("특수문자를 RFC 5545대로 이스케이프한다", () => {
    const ics = buildIcsCalendar(
      [
        {
          uid: "b@joblog",
          title: "과제; 제출, 마감",
          start: new Date("2026-07-25T05:00:00Z"),
          description: "줄1\n줄2",
        },
      ],
      generatedAt,
    );
    expect(ics).toContain("SUMMARY:과제\\; 제출\\, 마감");
    expect(ics).toContain("DESCRIPTION:줄1\\n줄2");
  });

  it("CRLF로 줄을 구분한다", () => {
    const ics = buildIcsCalendar([], generatedAt);
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});

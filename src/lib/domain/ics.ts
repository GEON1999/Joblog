export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  /** 기본 1시간 후 종료로 본다 */
  end?: Date;
  description?: string;
}

// ICS는 UTC 시각을 YYYYMMDDTHHMMSSZ로 쓴다
function toIcsUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

// RFC 5545: 쉼표·세미콜론·백슬래시·개행은 이스케이프한다
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const HOUR_MS = 60 * 60 * 1000;

/** 미완료 액션들을 구독 가능한 ICS 캘린더 문자열로 만든다 */
export function buildIcsCalendar(events: IcsEvent[], generatedAt: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JobLog//Next Actions//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:JobLog",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${toIcsUtc(generatedAt)}`,
      `DTSTART:${toIcsUtc(event.start)}`,
      `DTEND:${toIcsUtc(event.end ?? new Date(event.start.getTime() + HOUR_MS))}`,
      `SUMMARY:${escapeText(event.title)}`,
    );
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // RFC 5545: 줄 구분은 CRLF
  return lines.join("\r\n");
}

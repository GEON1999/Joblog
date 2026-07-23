// 사용자 기준 시간대. 서버(UTC)에서 계산해도 날짜 경계가 어긋나지 않도록 명시한다
export const APP_TIME_ZONE = "Asia/Seoul";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calendarDayNumber(date: Date, timeZone: string): number {
  // en-CA 로케일은 YYYY-MM-DD 형식을 보장한다
  const formatted = new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  const [year, month, day] = formatted.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/**
 * 단계 진입 후 며칠째인지 센다. 진입 당일이 1일째다 — "서류 넣고 12일째".
 * 달력 날짜 기준이므로 진입 23:59 → 다음날 00:01은 2일째다.
 */
export function daysInStage(enteredAt: Date, now: Date, timeZone: string = APP_TIME_ZONE): number {
  const diff = calendarDayNumber(now, timeZone) - calendarDayNumber(enteredAt, timeZone);
  return Math.max(diff, 0) + 1;
}

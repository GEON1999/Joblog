/**
 * datetime-local 입력값("YYYY-MM-DDTHH:mm")을 KST 시각으로 해석한다.
 * `new Date(value)`는 서버 시간대(Vercel=UTC)로 해석해 9시간이 어긋나므로
 * 오프셋을 명시해 파싱한다.
 */
export function parseKstDateTime(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) {
    return null;
  }
  const date = new Date(`${input}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

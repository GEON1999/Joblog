/**
 * http/https URL만 통과시킨다. `<a href>`로 렌더되는 값에 javascript: 같은
 * 스킴이 저장되면 클릭 시점 XSS가 되므로, 저장 전에 반드시 거른다.
 */
export function parseHttpUrl(value: string): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // fall through
  }
  return null;
}

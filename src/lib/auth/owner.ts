// AUTH_ALLOWED_EMAILS 는 더 이상 "로그인 관문"이 아니라 "무제한 오너 등급" 목록이다 (ADR 0010).
// 목록에 있으면 오너 — 스토리지 쿼터 등 모든 사용 상한이 면제된다. 없으면 일반 공개 유저.
export function isOwner(email: string | undefined): boolean {
  if (!email) {
    return false;
  }
  const owners = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.toLowerCase());
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 신뢰할 수 없는 입력이 Postgres uuid 캐스팅 예외(500)로 새는 것을 막는 사전 검증 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

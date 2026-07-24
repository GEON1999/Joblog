/** 쉼표 구분 태그 입력을 정규화한다: 공백 제거, 빈 항목 제거, 중복 제거 */
export function parseTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

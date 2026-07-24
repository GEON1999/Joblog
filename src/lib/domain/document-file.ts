export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB

// 제출 문서로 흔한 형식만 허용한다
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "hwp",
  "hwpx",
  "txt",
  "md",
] as const;

export type DocumentValidation =
  { ok: true } | { ok: false; reason: "empty" | "too-large" | "bad-extension" };

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function validateDocumentFile(fileName: string, size: number): DocumentValidation {
  if (size <= 0) {
    return { ok: false, reason: "empty" };
  }
  if (size > MAX_DOCUMENT_BYTES) {
    return { ok: false, reason: "too-large" };
  }
  if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extensionOf(fileName))) {
    return { ok: false, reason: "bad-extension" };
  }
  return { ok: true };
}

/**
 * 스토리지 경로에 안전한 파일명으로 정규화한다.
 * 경로 구분자·제어문자·공백을 밀어내 경로 탈출(../)과 깨진 키를 막는다.
 */
export function sanitizeFileName(fileName: string): string {
  const normalized = fileName
    .normalize("NFC")
    .replace(/[/\\]/g, "_") // 경로 구분자
    .replace(/\s+/g, "_") // 공백류
    .replace(/[^\p{L}\p{N}._-]/gu, "") // 문자·숫자·._- 외 제거
    .replace(/_{2,}/g, "_") // 연속 밑줄 압축
    .replace(/^[._]+/, "") // 선행 점·밑줄(숨김/상대경로) 제거
    .replace(/[._]+$/, ""); // 후행 점·밑줄 제거
  return normalized || "file";
}

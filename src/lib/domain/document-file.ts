// Vercel 서버리스 요청 본문 한도(4.5MB) 아래로 둔다 — 초과 시 우리 검증 대신 플랫폼 에러가 난다
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024; // 4MB

// 비오너(공개 가입자) 스토리지 쿼터 — 남용/비용 방어 (ADR 0010). 오너는 면제된다.
export const MAX_DOCUMENTS_PER_USER = 10;
export const MAX_TOTAL_DOCUMENT_BYTES_PER_USER = 30 * 1024 * 1024; // 30MB

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
 * 스토리지 객체 키를 만든다. Supabase Storage 키는 non-ASCII를 허용하지 않으므로
 * 원본 파일명(한글 등)을 쓰지 않고 UUID + 확장자로 만든다. 키는 사람이 읽을 필요가 없고,
 * 원본 파일명은 DB에 보존해 다운로드 시 쓴다. 파일명이 경로에 닿지 않아 경로 탈출도 원천 차단된다.
 *
 * 멀티테넌시(ADR 0010): userId 폴더로 네임스페이싱해 유저별로 물리 분리한다.
 * 결정 문서의 {documentId}는 documentId가 업로드 후 insert에서야 정해지고(고아 방지, ADR 0008)
 * Supabase 키가 non-ASCII를 거부하는 제약 때문에, 실제로는 유저 폴더 + 랜덤 UUID 키로 구현한다.
 */
export function buildStorageKey(userId: string, uuid: string, fileName: string): string {
  const ext = extensionOf(fileName);
  const object = ext ? `${uuid}.${ext}` : uuid;
  return `${userId}/${object}`;
}

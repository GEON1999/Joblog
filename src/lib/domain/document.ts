import type { DocumentKind } from "@/lib/db/schema";

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  resume: "이력서",
  portfolio: "포트폴리오",
  cover_letter: "자기소개서",
  other: "기타",
};

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  "resume",
  "portfolio",
  "cover_letter",
  "other",
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import Link from "next/link";

import { linkDocument, unlinkDocument } from "@/app/documents/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Badge, SectionTitle } from "@/components/ui/layout";
import type { Document } from "@/lib/db/schema";
import { DOCUMENT_KIND_LABELS, formatFileSize } from "@/lib/domain/document";

export function DocumentsSection({
  applicationId,
  linked,
  unlinked,
}: {
  applicationId: string;
  linked: Document[];
  unlinked: Document[];
}) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <SectionTitle>제출 문서</SectionTitle>
        <Link
          href="/documents"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          라이브러리
        </Link>
      </div>

      {linked.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">연결된 문서가 없습니다.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {linked.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Badge>{DOCUMENT_KIND_LABELS[document.kind]}</Badge>
                {document.name}
                <span className="text-xs text-muted-foreground">
                  {document.fileName} · {formatFileSize(document.fileSize)}
                </span>
              </span>
              <span className="flex shrink-0 gap-2">
                <a
                  href={`/api/documents/${document.id}`}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-muted"
                >
                  다운로드
                </a>
                <form action={unlinkDocument.bind(null, applicationId, document.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-muted"
                  >
                    연결 해제
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}

      {unlinked.length > 0 && (
        <form
          action={linkDocument.bind(null, applicationId)}
          className="mt-3 flex gap-2 rounded-xl border border-border bg-surface-muted p-3"
        >
          <Select name="documentId" defaultValue="" required>
            <option value="" disabled>
              라이브러리에서 문서 선택…
            </option>
            {unlinked.map((document) => (
              <option key={document.id} value={document.id}>
                [{DOCUMENT_KIND_LABELS[document.kind]}] {document.name}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" className="shrink-0">
            연결
          </Button>
        </form>
      )}
    </section>
  );
}

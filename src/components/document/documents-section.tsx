import Link from "next/link";

import { linkDocument, unlinkDocument } from "@/app/documents/actions";
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
        <h2 className="text-sm font-semibold text-gray-700">제출 문서</h2>
        <Link href="/documents" className="text-xs text-gray-500 hover:underline">
          라이브러리
        </Link>
      </div>

      {linked.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">연결된 문서가 없습니다.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {linked.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                  {DOCUMENT_KIND_LABELS[document.kind]}
                </span>
                {document.name}
                <span className="ml-1 text-xs text-gray-400">
                  {document.fileName} · {formatFileSize(document.fileSize)}
                </span>
              </span>
              <span className="flex shrink-0 gap-2">
                <a
                  href={`/api/documents/${document.id}`}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  다운로드
                </a>
                <form action={unlinkDocument.bind(null, applicationId, document.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
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
          className="mt-3 flex gap-2 rounded-md border border-gray-200 bg-gray-50 p-3"
        >
          <select
            name="documentId"
            defaultValue=""
            required
            className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          >
            <option value="" disabled>
              라이브러리에서 문서 선택…
            </option>
            {unlinked.map((document) => (
              <option key={document.id} value={document.id}>
                [{DOCUMENT_KIND_LABELS[document.kind]}] {document.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            연결
          </button>
        </form>
      )}
    </section>
  );
}

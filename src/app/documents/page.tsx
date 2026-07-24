import type { Metadata } from "next";
import Link from "next/link";

import { DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, formatFileSize } from "@/lib/domain/document";
import { getDocumentLibrary } from "@/lib/queries/documents";

import { deleteDocument, uploadDocument } from "./actions";

export const metadata: Metadata = {
  title: "제출 문서 — JobLog",
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-name": "버전명을 입력해 주세요.",
  "invalid-kind": "문서 종류가 올바르지 않습니다.",
  "missing-file": "파일을 선택해 주세요.",
  empty: "빈 파일은 업로드할 수 없습니다.",
  "too-large": "파일이 너무 큽니다 (최대 4MB).",
  "bad-extension": "허용되지 않은 파일 형식입니다.",
  "upload-failed": "업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  "delete-failed": "파일 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const library = await getDocumentLibrary();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">제출 문서</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 보드로
        </Link>
      </header>
      <p className="mt-1 text-sm text-gray-500">
        이력서·포트폴리오를 버전으로 보관하고 지원에 연결합니다. 어느 회사에 어떤 버전을 냈는지
        추적할 수 있습니다.
      </p>

      <form
        action={uploadDocument}
        className="mt-6 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">새 문서 업로드</h2>
        <div className="flex gap-2">
          <input
            type="text"
            name="name"
            required
            placeholder="버전명 (예: 이력서 v3 - 프론트 강조)"
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          />
          <select
            name="kind"
            defaultValue="resume"
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          >
            {DOCUMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {DOCUMENT_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>
        <input
          type="file"
          name="file"
          required
          accept=".pdf,.doc,.docx,.hwp,.hwpx,.txt,.md"
          className="text-sm"
        />
        <input
          type="text"
          name="memo"
          placeholder="메모 (선택)"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
        />
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button
          type="submit"
          className="self-start rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          업로드
        </button>
      </form>

      {library.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500">아직 업로드한 문서가 없습니다.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {library.map(({ document, linkedApplications }) => (
            <li key={document.id} className="rounded-md border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                      {DOCUMENT_KIND_LABELS[document.kind]}
                    </span>
                    {document.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {document.fileName} · {formatFileSize(document.fileSize)}
                  </p>
                  {document.memo && <p className="mt-1 text-xs text-gray-500">{document.memo}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/api/documents/${document.id}`}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    다운로드
                  </a>
                  <form action={deleteDocument.bind(null, document.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-red-600 hover:bg-gray-50"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>
              {linkedApplications.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1 text-xs text-gray-500">
                  제출:
                  {linkedApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="rounded-full bg-gray-100 px-2 py-0.5 hover:bg-gray-200"
                    >
                      {app.companyName} · {app.title}
                    </Link>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

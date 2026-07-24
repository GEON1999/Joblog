import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { FormError, Input, Select } from "@/components/ui/form";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/require-user";
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
  "quota-count": "문서 개수 한도(10개)에 도달했습니다. 기존 문서를 지우고 다시 시도해 주세요.",
  "quota-size": "저장 용량 한도(30MB)를 초과했습니다. 기존 문서를 지우고 다시 시도해 주세요.",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const user = await requireUser();
  const library = await getDocumentLibrary(user.id);

  return (
    <AppShell>
      <PageHeader
        title="제출 문서"
        description="이력서·포트폴리오를 버전으로 보관하고 지원에 연결합니다. 어느 회사에 어떤 버전을 냈는지 추적할 수 있습니다."
        back={{ href: "/", label: "보드로" }}
      />

      <Card className="bg-surface-muted">
        <form action={uploadDocument} className="flex flex-col gap-3">
          <SectionTitle>새 문서 업로드</SectionTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Input
                type="text"
                name="name"
                required
                placeholder="버전명 (예: 이력서 v3 - 프론트 강조)"
              />
            </div>
            <div className="sm:w-40 sm:shrink-0">
              <Select name="kind" defaultValue="resume">
                {DOCUMENT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {DOCUMENT_KIND_LABELS[kind]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.doc,.docx,.hwp,.hwpx,.txt,.md"
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-background"
          />
          <Input type="text" name="memo" placeholder="메모 (선택)" />
          {errorMessage && <FormError>{errorMessage}</FormError>}
          <Button type="submit" size="sm" className="self-start">
            업로드
          </Button>
        </form>
      </Card>

      {library.length === 0 ? (
        <div className="mt-6">
          <EmptyState>아직 업로드한 문서가 없습니다.</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {library.map(({ document, linkedApplications }) => (
            <li key={document.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Badge>{DOCUMENT_KIND_LABELS[document.kind]}</Badge>
                    {document.name}
                  </p>
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">
                    {document.fileName} · {formatFileSize(document.fileSize)}
                  </p>
                  {document.memo && (
                    <p className="mt-1 text-xs text-muted-foreground">{document.memo}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/api/documents/${document.id}`}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-muted"
                  >
                    다운로드
                  </a>
                  <form action={deleteDocument.bind(null, document.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-bg"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>
              {linkedApplications.length > 0 && (
                <p className="mt-2.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  제출:
                  {linkedApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="rounded-full bg-surface-muted px-2 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
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
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { notFound } from "next/navigation";

import { createInterview } from "@/app/interviews/actions";
import { getApplicationDetail } from "@/lib/queries/application-detail";
import { isUuid } from "@/lib/uuid";

export const metadata: Metadata = {
  title: "면접 등록 — JobLog",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "회차를 입력해 주세요.",
  "invalid-datetime": "일시 형식이 올바르지 않습니다.",
};

export default async function NewInterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) {
    notFound();
  }

  const detail = await getApplicationDetail(id);
  if (!detail) {
    notFound();
  }

  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <AppShell width="narrow">
      <Link href={`/applications/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← 지원 상세로
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-bold">면접 등록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {detail.companyName} · {detail.application.title}
        </p>
      </header>

      <form action={createInterview.bind(null, id)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          회차
          <input
            type="text"
            name="round"
            required
            placeholder="예: 1차, 2차, 컬처핏"
            className="rounded-md border border-border px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          일시 <span className="text-xs font-normal text-muted-foreground">(선택, 한국 시간)</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            className="rounded-md border border-border px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          방식 <span className="text-xs font-normal text-muted-foreground">(선택)</span>
          <input
            type="text"
            name="format"
            placeholder="예: 대면, 화상, 전화"
            className="rounded-md border border-border px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
        <button
          type="submit"
          className="rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          등록
        </button>
      </form>
    </AppShell>
  );
}

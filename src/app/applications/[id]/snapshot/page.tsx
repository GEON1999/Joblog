import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { notFound } from "next/navigation";

import { getApplicationDetail } from "@/lib/queries/application-detail";
import { isUuid } from "@/lib/uuid";

import { savePostingSnapshot } from "../../actions";

export const metadata: Metadata = {
  title: "공고 스냅샷 — JobLog",
};

export default async function SnapshotEditPage({
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

  const { companyName, application, snapshot } = detail;

  return (
    <AppShell>
      <Link href={`/applications/${id}`} className="text-sm text-muted-foreground hover:underline">
        ← 지원 상세로
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-bold">공고 스냅샷</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {companyName} · {application.title}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          지원 시점의 공고 원문을 보존하는 곳입니다. 공고가 내려가도 여기 저장한 원문은 남습니다.
        </p>
      </header>

      <form action={savePostingSnapshot.bind(null, id)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          원본 URL <span className="text-xs font-normal text-muted-foreground">(선택)</span>
          <input
            type="url"
            name="sourceUrl"
            defaultValue={snapshot?.sourceUrl ?? ""}
            placeholder="https://..."
            className="rounded-md border border-border px-3 py-2 outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          공고 본문
          <textarea
            name="content"
            required
            rows={16}
            defaultValue={snapshot?.content ?? ""}
            placeholder="공고 본문을 그대로 붙여넣으세요"
            className="rounded-md border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
          />
        </label>
        {error === "missing" && <p className="text-sm text-danger">본문을 입력해 주세요.</p>}
        {error === "invalid-url" && (
          <p className="text-sm text-danger">원본 URL은 http(s) 주소여야 합니다.</p>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary py-2 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          저장
        </button>
      </form>
    </AppShell>
  );
}

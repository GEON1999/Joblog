import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href={`/applications/${id}`} className="text-sm text-gray-500 hover:underline">
        ← 지원 상세로
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-bold">공고 스냅샷</h1>
        <p className="mt-1 text-sm text-gray-500">
          {companyName} · {application.title}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          지원 시점의 공고 원문을 보존하는 곳입니다. 공고가 내려가도 여기 저장한 원문은 남습니다.
        </p>
      </header>

      <form action={savePostingSnapshot.bind(null, id)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          원본 URL <span className="text-xs font-normal text-gray-400">(선택)</span>
          <input
            type="url"
            name="sourceUrl"
            defaultValue={snapshot?.sourceUrl ?? ""}
            placeholder="https://..."
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
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
            className="rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:border-gray-500 focus:outline-none"
          />
        </label>
        {error === "missing" && <p className="text-sm text-red-600">본문을 입력해 주세요.</p>}
        <button
          type="submit"
          className="rounded-md bg-gray-900 py-2 font-medium text-white hover:bg-gray-700"
        >
          저장
        </button>
      </form>
    </main>
  );
}

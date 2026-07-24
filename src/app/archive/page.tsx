import type { Metadata } from "next";
import Link from "next/link";

import { OUTCOME_LABELS } from "@/lib/domain/outcome";
import { STAGE_LABELS } from "@/lib/domain/stage";
import { formatDate } from "@/lib/format";
import { getArchivedApplications } from "@/lib/queries/application-detail";

export const metadata: Metadata = {
  title: "아카이브 — JobLog",
};

// 쿠키/파라미터를 읽지 않는 페이지라 정적 프리렌더 대상이 된다 —
// 빌드 시점 DB 접근(CI엔 env가 없다)과 stale 목록을 막기 위해 명시적으로 동적 렌더
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const archived = await getArchivedApplications();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">아카이브</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 보드로
        </Link>
      </header>

      {archived.length === 0 ? (
        <p className="mt-16 text-center text-sm text-gray-500">종료된 지원이 없습니다.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {archived.map((item) => (
            <li key={item.id}>
              <Link
                href={`/applications/${item.id}`}
                className="flex items-baseline justify-between rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-gray-500">{item.companyName}</span>
                  <span className="mt-0.5 block truncate text-sm font-medium">{item.title}</span>
                </span>
                <span className="ml-4 shrink-0 text-right text-xs text-gray-500">
                  <span className="block">
                    {STAGE_LABELS[item.stage]}에서 {OUTCOME_LABELS[item.outcome]}
                  </span>
                  {item.closedAt && (
                    <span className="mt-0.5 block">{formatDate(item.closedAt)}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

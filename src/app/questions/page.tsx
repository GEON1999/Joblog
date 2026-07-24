import type { Metadata } from "next";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import { getQuestionBank } from "@/lib/queries/interviews";

export const metadata: Metadata = {
  title: "질문 은행 — JobLog",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const entries = await getQuestionBank({
    keyword: q?.trim() || undefined,
    tag: tag?.trim() || undefined,
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">질문 은행</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← 보드로
        </Link>
      </header>
      <p className="mt-1 text-sm text-gray-500">
        모든 면접에서 받은 질문 {entries.length}개. 다음 면접 대비 자산입니다.
      </p>

      <form method="GET" className="mt-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="질문 검색"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          검색
        </button>
      </form>

      {tag && (
        <p className="mt-3 text-sm text-gray-600">
          태그 <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tag}</span> 필터 중 ·{" "}
          <Link href="/questions" className="text-xs text-gray-500 hover:underline">
            해제
          </Link>
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-sm text-gray-500">
          {q || tag ? "조건에 맞는 질문이 없습니다." : "아직 기록된 질문이 없습니다."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map(({ question, interviewId, round, companyName }) => (
            <li key={question.id} className="rounded-md border border-gray-200 p-4">
              <p className="text-sm font-medium">{question.question}</p>
              {question.preparedAnswer && (
                <p className="mt-1 text-xs text-gray-600">
                  <span className="font-semibold text-gray-500">준비한 답변</span> ·{" "}
                  {question.preparedAnswer}
                </p>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-400">
                <Link href={`/interviews/${interviewId}`} className="hover:underline">
                  {companyName} · {round}
                </Link>
                <span>· {formatDate(question.createdAt)}</span>
                {question.tags.map((questionTag) => (
                  <Link
                    key={questionTag}
                    href={`/questions?tag=${encodeURIComponent(questionTag)}`}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200"
                  >
                    {questionTag}
                  </Link>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

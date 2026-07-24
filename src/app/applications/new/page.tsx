import type { Metadata } from "next";
import Link from "next/link";

import { getDb } from "@/lib/db";

import { createApplication } from "../actions";

export const metadata: Metadata = {
  title: "지원 등록 — JobLog",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "회사명과 직무명을 입력해 주세요.",
  "invalid-date": "지원일 형식이 올바르지 않습니다.",
  "invalid-url": "공고 URL은 http(s) 주소여야 합니다.",
};

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const existingCompanies = await getDb().query.companies.findMany({
    columns: { name: true },
    orderBy: (companies, { asc }) => [asc(companies.name)],
  });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold">지원 등록</h1>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          보드로 돌아가기
        </Link>
      </header>
      <form action={createApplication} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          회사명
          <input
            type="text"
            name="companyName"
            required
            list="company-names"
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
          <datalist id="company-names">
            {existingCompanies.map((company) => (
              <option key={company.name} value={company.name} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          직무명
          <input
            type="text"
            name="title"
            required
            placeholder="예: 프론트엔드 개발자"
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          지원일
          <input
            type="date"
            name="appliedAt"
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">비워두면 오늘로 기록됩니다</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          공고 URL <span className="text-xs font-normal text-gray-400">(선택)</span>
          <input
            type="url"
            name="postingUrl"
            placeholder="https://..."
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          공고 본문 <span className="text-xs font-normal text-gray-400">(선택)</span>
          <textarea
            name="postingContent"
            rows={8}
            placeholder="공고가 내려가기 전에 원문을 붙여넣어 보존하세요"
            className="rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:border-gray-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">
            지원 시점의 원문이 그대로 저장됩니다. 나중에 상세에서 추가할 수도 있습니다.
          </span>
        </label>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button
          type="submit"
          className="rounded-md bg-gray-900 py-2 font-medium text-white hover:bg-gray-700"
        >
          등록
        </button>
      </form>
    </main>
  );
}

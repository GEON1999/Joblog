import type { Metadata } from "next";

import { login } from "./actions";

export const metadata: Metadata = {
  title: "로그인 — JobLog",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "이메일과 비밀번호를 입력해 주세요.",
  invalid: "이메일 또는 비밀번호가 올바르지 않습니다.",
  forbidden: "허용되지 않은 계정입니다.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold">JobLog</h1>
        <form action={login} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            이메일
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            비밀번호
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
            />
          </label>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            className="rounded-md bg-gray-900 py-2 font-medium text-white hover:bg-gray-700"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}

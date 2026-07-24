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
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="11" width="4" height="10" rx="1" fill="currentColor" />
              <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity="0.85" />
              <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.7" />
            </svg>
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">JobLog</h1>
            <p className="mt-1 text-sm text-muted-foreground">구직 활동을 한 곳에서 추적하세요</p>
          </div>
        </div>
        <form
          action={login}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            이메일
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-lg border border-border bg-input px-3 py-2 font-normal outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            비밀번호
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-border bg-input px-3 py-2 font-normal outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          {errorMessage && (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="mt-1 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}

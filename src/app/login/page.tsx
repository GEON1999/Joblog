import type { Metadata } from "next";

import { AuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "로그인 — JobLog",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "이메일과 비밀번호를 입력해 주세요.",
  invalid: "이메일 또는 비밀번호가 올바르지 않습니다.",
  "weak-password": "비밀번호는 6자 이상이어야 합니다.",
  "email-taken": "이미 가입된 이메일입니다. 로그인해 주세요.",
  "signup-failed": "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

const NOTICE_MESSAGES: Record<string, string> = {
  "confirm-email": "확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string; notice?: string }>;
}) {
  const { error, mode, notice } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const noticeMessage = notice ? NOTICE_MESSAGES[notice] : undefined;
  const initialMode = mode === "signup" ? "signup" : "login";

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
        {errorMessage && (
          <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        )}
        {noticeMessage && (
          <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {noticeMessage}
          </p>
        )}
        <AuthForm initialMode={initialMode} />
      </div>
    </main>
  );
}

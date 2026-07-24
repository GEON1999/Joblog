"use client";

import Script from "next/script";
import { useState } from "react";

import { login, signUp } from "./actions";

type Mode = "login" | "signup";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const isSignup = mode === "signup";
  const action = isSignup ? signUp : login;

  return (
    <>
      {/* Turnstile: 사이트 키가 설정된 경우에만 로드한다. 위젯이 폼에 cf-turnstile-response 히든 필드를 심는다 */}
      {TURNSTILE_SITE_KEY && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
      <form
        action={action}
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
            minLength={isSignup ? 6 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="rounded-lg border border-border bg-input px-3 py-2 font-normal outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {isSignup && <span className="text-xs font-normal text-muted-foreground">6자 이상</span>}
        </label>

        {TURNSTILE_SITE_KEY && <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} />}

        <button
          type="submit"
          className="mt-1 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {isSignup ? "회원가입" : "로그인"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isSignup ? "이미 계정이 있으신가요? " : "계정이 없으신가요? "}
        <button
          type="button"
          onClick={() => setMode(isSignup ? "login" : "signup")}
          className="font-semibold text-primary hover:underline"
        >
          {isSignup ? "로그인" : "회원가입"}
        </button>
      </p>
    </>
  );
}

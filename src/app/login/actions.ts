"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Turnstile 위젯이 폼에 심는 히든 필드. 캡차를 켜면 Supabase가 모든 auth 요청에서 검증한다.
const CAPTCHA_FIELD = "cf-turnstile-response";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const captchaToken = String(formData.get(CAPTCHA_FIELD) ?? "") || undefined;

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const captchaToken = String(formData.get(CAPTCHA_FIELD) ?? "") || undefined;

  if (!email || !password) {
    redirect("/login?mode=signup&error=missing");
  }
  // Supabase 기본 최소 길이와 맞춘다 — UX상 서버에서도 한 번 거른다
  if (password.length < 6) {
    redirect("/login?mode=signup&error=weak-password");
  }

  const supabase = await createClient();
  // 이메일 인증 없이 즉시 세션을 발급받는다 — Supabase에서 "Confirm email" OFF 전제 (ADR 0010)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { captchaToken },
  });

  if (error) {
    const reason = error.message.toLowerCase().includes("already")
      ? "email-taken"
      : "signup-failed";
    redirect(`/login?mode=signup&error=${reason}`);
  }

  // Confirm email이 켜져 있으면 세션이 없을 수 있다 — 이 경우 확인 안내로 보낸다
  if (!data.session) {
    redirect("/login?notice=confirm-email");
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { requireEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/login";
  // 오픈 서비스: 로그인된 유저면 누구나 접근한다 (ADR 0010)
  const isAuthenticated = user !== null;

  // 리다이렉트 응답에도 갱신된 세션 쿠키를 실어야 한다.
  // 버리면 rotation으로 무효화된 구 refresh token만 남아 세션이 끊길 수 있다.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const redirected = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  };

  if (!isAuthenticated && !isLoginPage) {
    return redirectTo("/login");
  }

  if (isAuthenticated && isLoginPage) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  // api/ics는 토큰으로 자체 인증한다 — 캘린더 클라이언트는 세션 쿠키를 못 실으므로 제외한다 (ADR 0007)
  matcher: [
    "/((?!api/ics|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

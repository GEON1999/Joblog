"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "보드" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/documents", label: "문서" },
  { href: "/questions", label: "질문 은행" },
  { href: "/offers", label: "오퍼" },
  { href: "/archive", label: "아카이브" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppHeader({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <BrandMark />
          <span className="text-base font-bold tracking-tight">JobLog</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {email && (
            <form action={logout}>
              <button
                type="submit"
                title={email}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                로그아웃
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="11" width="4" height="10" rx="1" fill="currentColor" />
        <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity="0.85" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.7" />
      </svg>
    </span>
  );
}

import { AppHeader } from "./app-header";

/** 인증된 페이지 공통 셸: 상단 헤더 + 중앙 정렬 컨테이너 */
export function AppShell({
  children,
  width = "default",
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
}) {
  const maxWidth = width === "wide" ? "max-w-6xl" : width === "narrow" ? "max-w-lg" : "max-w-3xl";

  return (
    <>
      <AppHeader />
      <main className={`mx-auto w-full ${maxWidth} px-4 py-8`}>{children}</main>
    </>
  );
}

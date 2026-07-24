"use client";

import { useSyncExternalStore } from "react";

import { clearMyData, seedSampleData } from "@/app/onboarding/actions";

// 첫 방문 1회 코치마크 + 샘플 데이터 채우기/비우기 (ADR 0010).
// "봤음" 플래그는 기기별 localStorage 에 둔다 — 잠깐 체험하는 담당자에겐 테이블 신설이 과하다.
// localStorage 를 useSyncExternalStore 로 읽어 SSR/하이드레이션 불일치와 effect-setState 를 피한다.
const SEEN_KEY = "joblog:onboarding-seen";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSeen() {
  return localStorage.getItem(SEEN_KEY) === "1";
}

// 서버에서는 "봤음"으로 취급해 환영 카드를 렌더하지 않는다 (클라이언트에서만 판단)
function getServerSeen() {
  return true;
}

function markSeen() {
  localStorage.setItem(SEEN_KEY, "1");
  listeners.forEach((listener) => listener());
}

export function OnboardingGuide({ hasData }: { hasData: boolean }) {
  const seen = useSyncExternalStore(subscribe, getSeen, getServerSeen);

  // 첫 방문 카드: 아직 안 봤고, 데이터가 비어 있을 때만. (이미 쓰던 유저는 방해하지 않는다)
  const showWelcome = !seen && !hasData;

  return (
    <>
      {showWelcome && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-accent/40 p-5">
          <h2 className="text-base font-semibold">JobLog에 오신 걸 환영합니다 👋</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            지원 현황을 칸반 보드로 관리하고, 단계별 체류 일수·전환율·오퍼 비교까지 한 곳에서
            봅니다. 빈 화면이 낯설다면 <b>샘플 데이터</b>로 채워진 모습을 먼저 둘러보세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={seedSampleData}>
              <button
                type="submit"
                onClick={markSeen}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                샘플 데이터 채우기
              </button>
            </form>
            <button
              type="button"
              onClick={markSeen}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
            >
              빈 화면으로 시작
            </button>
          </div>
        </div>
      )}

      {/* 첫 방문 카드를 지난 뒤에도 언제든 채우기/비우기 가능한 작은 컨트롤 */}
      {(seen || hasData) && (
        <div className="mb-4 flex justify-end gap-3 text-xs text-muted-foreground">
          {hasData ? (
            <form action={clearMyData}>
              <button type="submit" className="hover:text-danger hover:underline">
                내 데이터 비우기
              </button>
            </form>
          ) : (
            <form action={seedSampleData}>
              <button type="submit" className="hover:text-primary hover:underline">
                샘플 데이터 채우기
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

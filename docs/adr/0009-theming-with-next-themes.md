# 라이트/다크 테마는 next-themes로, 기본은 라이트

다크 모드를 지원하되 **기본값은 라이트**로 두고, 테마 전환·저장·SSR 처리를 `next-themes`로 한다. 테마 상태는 `<html>`의 `class`(`dark`)로 표현하고 Tailwind의 `dark:` 변형이 이를 따른다. 전역 상태 관리 라이브러리(Zustand/Redux 등)는 도입하지 않는다 — 지금 앱 전역에 공유할 클라이언트 상태는 테마뿐이고, 그것은 전용 라이브러리가 더 잘 푼다.

## Considered Options

- **직접 구현(useState + localStorage + useEffect)** — 의존성이 없지만, SSR에서 첫 페인트 시 테마가 깜빡이는(flash of wrong theme) 문제를 직접 막아야 한다. next-themes는 `<head>`에 블로킹 스크립트를 심어 이 깜빡임을 없앤다 — 바퀴를 다시 발명할 이유가 없다.
- **`prefers-color-scheme`만 사용(현재 상태)** — OS 설정을 그대로 따른다. 하지만 "기본은 라이트, 사용자가 원하면 다크"라는 요구는 토글과 저장이 필요해 CSS만으론 안 된다.
- **범용 상태 관리 라이브러리 도입** — 테마 하나 때문에 전역 스토어를 들이는 것은 과하다. 실제로 전역 공유가 필요한 클라이언트 상태가 늘어나면 그때 별도 ADR로 판단한다.

## Consequences

- Tailwind는 클래스 기반 다크 모드를 쓴다(`@custom-variant dark`). `next-themes`가 `<html class="dark">`를 토글한다.
- `defaultTheme="light"`, `enableSystem={false}` — OS가 다크여도 첫 방문은 라이트다. 전환값은 localStorage에 저장된다.
- `<html>`에 `suppressHydrationWarning`이 필요하다(서버 렌더 시점엔 테마 클래스를 모르므로).
- 색은 전부 CSS 변수(디자인 토큰)로 두고 라이트/다크 값을 각각 정의한다. 컴포넌트는 raw 색이 아니라 시맨틱 토큰(`bg-surface`, `text-foreground` 등)을 참조해, 테마 전환이 한 곳에서 이뤄진다.

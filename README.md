# JobLog

구직 활동을 한 곳에서 기록·추적하는 지원 관리 도구입니다. 지원 건을 파이프라인 칸반으로 추적하고, 마감되면 사라지는 공고 원문과 제출한 이력서 버전을 보존하며, 면접에서 받은 질문을 다음 면접의 자산으로 축적합니다. 누구나 회원가입해 자기 데이터만 격리해서 사용합니다.

## Docs

- [기획서 (PRD)](docs/prd.md) — 문제 정의, 기능 범위, 도메인 모델 개요
- [도메인 용어집 (CONTEXT.md)](CONTEXT.md) — 프로젝트 전체가 따르는 단일 용어 정의
- [ADR](docs/adr/) — 주요 기술 결정과 근거

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · Vercel · Supabase (Postgres / Storage / Auth)

기술 선택의 근거는 ADR로 기록합니다.

## 캘린더 구독 (ICS)

다음 액션을 캘린더에서 보려면 `.env`의 `ICS_FEED_SECRET`을 임의의 긴 문자열로 설정합니다. 피드 URL은 유저별로 다르며, 유저 id와 그 id의 HMAC 토큰(`HMAC(ICS_FEED_SECRET, userId)`)으로 구성됩니다.

```
https://<배포 도메인>/api/ics?uid=<userId>&token=<token>
```

캘린더 클라이언트는 로그인 세션을 실을 수 없어 이 피드만 토큰으로 인증합니다 ([ADR 0007](docs/adr/0007-ics-feed-token-auth.md), [ADR 0010](docs/adr/0010-open-service-multi-tenant.md)). 시크릿이 유출되면 값을 교체해 모든 구독 URL을 무효화합니다.

## Development

### 사전 준비 (Supabase)

공개 가입 오픈 서비스입니다 — 누구나 회원가입해 자기 데이터만 격리해서 씁니다 ([ADR 0010](docs/adr/0010-open-service-multi-tenant.md)).

1. [Supabase](https://supabase.com) 프로젝트 생성
2. **Authentication → Sign In / Up**에서 신규 가입(Allow new users to sign up) **활성화**, 그리고 **Confirm email**을 **비활성화**(이메일 인증 없이 즉시 로그인)
3. **Authentication → Attack Protection**에서 **CAPTCHA**를 켜고 **Cloudflare Turnstile**을 선택 — 봇 대량가입 방어. Turnstile 사이트/시크릿 키를 `.env`에 넣습니다.
4. **Storage → New bucket**으로 `documents` 버킷을 **private**으로 생성 (제출 문서 저장용)
5. `.env.example`을 `.env.local`로 복사한 뒤 값 입력:
   - URL·anon key·`SUPABASE_SERVICE_ROLE_KEY` → **Project Settings → API**
   - `DATABASE_URL` → **Connect → Transaction pooler**
   - `AUTH_ALLOWED_EMAILS` → **오너(무제한) 등급** 이메일. 로그인 관문이 아니라 스토리지 쿼터 등 사용 상한을 면제받는 계정 목록입니다.
   - `ICS_FEED_SECRET` → 임의의 긴 문자열
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`·`TURNSTILE_SECRET_KEY` → 위 3번의 Turnstile 키
6. `pnpm db:migrate`로 마이그레이션 적용. 최초 멀티테넌시 마이그레이션(`0006`)은 기존 데이터를 **가장 먼저 생성된 auth 유저(= 오너)**에게 귀속시키니, 실행 전 그 가정이 맞는지 확인하세요.

> `SUPABASE_SERVICE_ROLE_KEY`는 모든 접근 제어를 우회하는 키입니다. 서버에서만 쓰이며 절대 클라이언트에 노출하면 안 됩니다 ([ADR 0008](docs/adr/0008-private-file-storage.md)).

### 실행

```bash
pnpm install   # 의존성 설치
pnpm dev       # 로컬 개발 서버 (http://localhost:3000)
```

| 명령               | 설명                            |
| ------------------ | ------------------------------- |
| `pnpm lint`        | ESLint 검사                     |
| `pnpm typecheck`   | TypeScript 타입 검사            |
| `pnpm format`      | Prettier 포맷팅                 |
| `pnpm test`        | Vitest 단위 테스트              |
| `pnpm db:generate` | 스키마 변경 → 마이그레이션 생성 |
| `pnpm db:migrate`  | 마이그레이션 적용               |

PR마다 CI(GitHub Actions)가 lint · typecheck · test · format 검사를 실행합니다.

# JobLog

구직 활동을 한 곳에서 기록·추적하는 개인용 지원 관리 도구입니다. 지원 건을 파이프라인 칸반으로 추적하고, 마감되면 사라지는 공고 원문과 제출한 이력서 버전을 보존하며, 면접에서 받은 질문을 다음 면접의 자산으로 축적합니다.

## Docs

- [기획서 (PRD)](docs/prd.md) — 문제 정의, 기능 범위, 도메인 모델 개요
- [도메인 용어집 (CONTEXT.md)](CONTEXT.md) — 프로젝트 전체가 따르는 단일 용어 정의
- [ADR](docs/adr/) — 주요 기술 결정과 근거

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · Vercel · Supabase (Postgres / Storage / Auth)

기술 선택의 근거는 ADR로 기록합니다.

## Development

### 사전 준비 (Supabase)

싱글유저 앱이므로 회원가입 기능이 없습니다. 계정은 Supabase 대시보드에서 직접 만듭니다.

1. [Supabase](https://supabase.com) 프로젝트 생성
2. **Authentication → Users → Add user**로 로그인에 사용할 계정 생성
3. **Authentication → Sign In / Up**에서 신규 가입(Allow new users to sign up) 비활성화 권장
4. `.env.example`을 `.env.local`로 복사한 뒤 값 입력 (URL·anon key는 **Project Settings → API**, `DATABASE_URL`은 **Connect → Transaction pooler**)
5. `pnpm db:migrate`로 마이그레이션 적용

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

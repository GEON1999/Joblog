# JobLog

구직 활동을 한 곳에서 기록·추적하는 개인용 지원 관리 도구입니다. 지원 건을 파이프라인 칸반으로 추적하고, 마감되면 사라지는 공고 원문과 제출한 이력서 버전을 보존하며, 면접에서 받은 질문을 다음 면접의 자산으로 축적합니다.

## Docs

- [기획서 (PRD)](docs/prd.md) — 문제 정의, 기능 범위, 도메인 모델 개요
- [도메인 용어집 (CONTEXT.md)](CONTEXT.md) — 프로젝트 전체가 따르는 단일 용어 정의
- ADR — `docs/adr/` (작성 예정)

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · Vercel · Supabase (Postgres / Storage / Auth)

기술 선택의 근거는 ADR로 기록합니다.

## Development

```bash
pnpm install   # 의존성 설치
pnpm dev       # 로컬 개발 서버 (http://localhost:3000)
```

| 명령             | 설명                 |
| ---------------- | -------------------- |
| `pnpm lint`      | ESLint 검사          |
| `pnpm typecheck` | TypeScript 타입 검사 |
| `pnpm format`    | Prettier 포맷팅      |

PR마다 CI(GitHub Actions)가 lint · typecheck · format 검사를 실행합니다.

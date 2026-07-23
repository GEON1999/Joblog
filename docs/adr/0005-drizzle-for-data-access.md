# 데이터 접근은 Drizzle ORM — 서버 전용 경로, Data API는 잠근다

스키마 관리와 쿼리에 Drizzle ORM(+drizzle-kit)을 사용하고, Supabase Postgres에 서버에서 직접 연결한다. 도메인 모델이 TypeScript 스키마 코드로 레포에 남고, 전환율 대시보드 같은 집계 쿼리를 SQL 수준의 표현력으로 작성할 수 있으며, 런타임이 가벼워 서버리스 환경 부담이 적다는 것이 선택 이유다.

## Considered Options

- **supabase-js (PostgREST)** — 추가 의존성이 없고 RLS가 자연스럽게 적용되지만, 스키마가 코드 밖(SQL 마이그레이션)에만 존재하고 집계·조인 표현력이 제한되어 대시보드 쿼리를 RPC로 우회해야 한다.
- **Prisma** — 가장 대중적이지만 런타임이 무겁고 cold start 부담이 있어 서버리스에서 Drizzle 대비 이점이 없다.

## Consequences

- DB 접근 경로가 서버 전용이 되므로 PostgREST(Data API) 경로는 사용하지 않는다. 모든 테이블은 RLS를 활성화하되 정책을 만들지 않아(deny-all) anon key로는 어떤 데이터에도 접근할 수 없다. Supabase Auth는 인증에만 사용한다.
- 마이그레이션 SQL은 drizzle-kit으로 생성해 레포에 커밋하고, 적용 절차는 README에 문서화한다.
- 서버리스에서 커넥션 폭주를 피하기 위해 Supabase의 connection pooler(transaction mode)로 접속하며, 이 모드는 prepared statement를 지원하지 않으므로 드라이버에서 비활성화한다.

# Supabase 올인원 — DB·Storage·Auth를 한 곳에서

Postgres, 파일 스토리지(이력서 파일), 인증이 모두 필요한데, 이를 각각 다른 서비스로 조합하는 대신 Supabase 하나로 통일한다. 싱글유저 도구에서 관리 포인트(콘솔, 키, 과금, 장애 지점)를 하나로 줄이는 가치가 각 영역 베스트 서비스를 고르는 가치보다 크다.

## Considered Options

- **Neon(Postgres) + Vercel Blob + Auth.js** — 영역별로는 더 나은 선택일 수 있으나 관리 포인트가 3개로 늘고, 인증·스토리지·DB 간 연동을 직접 구성해야 한다.

## Consequences

- 이력서 파일은 개인정보이므로 버킷은 private으로 두고, 접근은 서버 경유로만 허용한다.
- 인증은 Supabase Auth에 허용 계정 화이트리스트를 더해, 배포된 앱이어도 타인은 로그인·데이터 접근이 불가능하다.

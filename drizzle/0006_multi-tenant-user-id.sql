-- 멀티테넌시 도입: 루트 테이블에 user_id 추가 (ADR 0010)
-- 기존 단일 유저 데이터를 보존해야 하므로 nullable 추가 → 백필 → NOT NULL 순서로 처리한다.

--> 회사명 전역 유니크 제거 (유저별 유니크로 대체)
ALTER TABLE "companies" DROP CONSTRAINT "companies_name_unique";--> statement-breakpoint

--> 1) nullable 로 컬럼 추가
ALTER TABLE "applications" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "user_id" uuid;--> statement-breakpoint

--> 2) 기존 데이터 백필 — 가장 먼저 생성된 auth 유저(= 프로젝트 오너)에게 귀속시킨다.
--> 싱글 유저 이력이라 오너가 유일하며, 오너 계정과 격리되어 이후 가입자에겐 보이지 않는다.
UPDATE "companies" SET "user_id" = (SELECT "id" FROM "auth"."users" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
UPDATE "applications" SET "user_id" = (SELECT "id" FROM "auth"."users" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
UPDATE "documents" SET "user_id" = (SELECT "id" FROM "auth"."users" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint

--> 3) NOT NULL 확정
ALTER TABLE "applications" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

--> 4) auth.users 로의 FK — 유저 삭제 시 소유 데이터도 함께 정리한다.
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;--> statement-breakpoint

--> 5) 유저별 조회 인덱스
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "companies_user_id_idx" ON "companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint

--> 6) 유저별 회사명 유니크
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_name_key" UNIQUE("user_id","name");

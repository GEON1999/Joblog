import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 진행 단계(Stage). 종료 여부는 outcome이 직교로 담당한다 — ADR 0003
export const stageEnum = pgEnum("stage", [
  "applied", // 지원함
  "screening", // 서류
  "assignment", // 과제
  "interview", // 면접
  "offer", // 오퍼
]);

// 결과(Outcome). 종료된 지원도 stage에 마지막 단계를 보존한다
export const outcomeEnum = pgEnum("outcome", [
  "in_progress", // 진행중
  "rejected", // 탈락
  "withdrawn", // 철회
  "accepted", // 수락
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    title: text("title").notNull(),
    stage: stageEnum("stage").notNull().default("applied"),
    outcome: outcomeEnum("outcome").notNull().default("in_progress"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("applications_company_id_idx").on(table.companyId),
    // 종료 시각은 종료된 지원에만, 진행중인 지원에는 없어야 한다
    check(
      "applications_closed_iff_ended",
      sql`(${table.outcome} = 'in_progress') = (${table.closedAt} IS NULL)`,
    ),
  ],
).enableRLS();

export const stageTransitions = pgTable(
  "stage_transitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStage: stageEnum("from_stage"), // null이면 생성 시 초기 진입
    toStage: stageEnum("to_stage").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stage_transitions_application_id_idx").on(table.applicationId),
    // 같은 단계로의 no-op 전환은 체류 일수 계산을 오염시킨다
    check(
      "stage_transitions_stage_changed",
      sql`${table.fromStage} IS DISTINCT FROM ${table.toStage}`,
    ),
  ],
).enableRLS();

export type Stage = (typeof stageEnum.enumValues)[number];
export type Outcome = (typeof outcomeEnum.enumValues)[number];
export type Company = typeof companies.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type StageTransition = typeof stageTransitions.$inferSelect;

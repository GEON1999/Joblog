import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

export const postingSnapshots = pgTable("posting_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .unique() // 지원당 스냅샷 하나 — CONTEXT.md
    .references(() => applications.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export const nextActionKindEnum = pgEnum("next_action_kind", [
  "interview", // 면접 일정
  "assignment_due", // 과제 마감
  "follow_up", // 팔로업
  "other", // 기타
]);

export const nextActions = pgTable(
  "next_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: nextActionKindEnum("kind").notNull().default("other"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }), // null이면 미완료
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("next_actions_application_id_idx").on(table.applicationId)],
).enableRLS();

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    round: text("round").notNull(), // "1차", "2차", "컬처핏" 등 자유 라벨
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    format: text("format"), // 대면/화상/전화 등 자유 입력
    retrospective: text("retrospective"), // 면접 직후 자유 회고
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("interviews_application_id_idx").on(table.applicationId)],
).enableRLS();

export const interviewQuestions = pgTable(
  "interview_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    interviewId: uuid("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answerAtTime: text("answer_at_time"), // 당시 내 답변
    preparedAnswer: text("prepared_answer"), // 다시 준비한 답변
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("interview_questions_interview_id_idx").on(table.interviewId)],
).enableRLS();

export const contractTypeEnum = pgEnum("contract_type", [
  "permanent", // 정규
  "contract", // 계약
  "freelance", // 프리랜서
]);

export const workModeEnum = pgEnum("work_mode", [
  "office", // 사무실
  "remote", // 재택
  "hybrid", // 하이브리드
]);

export interface OfferExtra {
  label: string;
  value: string;
}

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .unique() // 지원당 오퍼 하나 — CONTEXT.md
    .references(() => applications.id, { onDelete: "cascade" }),
  annualSalary: integer("annual_salary"), // 만원 단위, null이면 미정
  contractType: contractTypeEnum("contract_type"),
  workMode: workModeEnum("work_mode"),
  crunch: boolean("crunch"), // null이면 미확인
  extras: jsonb("extras").$type<OfferExtra[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type Stage = (typeof stageEnum.enumValues)[number];
export type Outcome = (typeof outcomeEnum.enumValues)[number];
export type Company = typeof companies.$inferSelect;
export type PostingSnapshot = typeof postingSnapshots.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type NextAction = typeof nextActions.$inferSelect;
export type NextActionKind = (typeof nextActionKindEnum.enumValues)[number];
export type Offer = typeof offers.$inferSelect;
export type ContractType = (typeof contractTypeEnum.enumValues)[number];
export type WorkMode = (typeof workModeEnum.enumValues)[number];
export type Application = typeof applications.$inferSelect;
export type StageTransition = typeof stageTransitions.$inferSelect;

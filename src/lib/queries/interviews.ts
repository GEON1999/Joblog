import { and, arrayContains, asc, desc, eq, ilike } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  applications,
  companies,
  interviewQuestions,
  interviews,
  type Interview,
  type InterviewQuestion,
} from "@/lib/db/schema";

export async function getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
  return getDb()
    .select()
    .from(interviews)
    .where(eq(interviews.applicationId, applicationId))
    .orderBy(asc(interviews.createdAt));
}

export interface InterviewDetail {
  interview: Interview;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
  questions: InterviewQuestion[];
}

export async function getInterviewDetail(id: string): Promise<InterviewDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      interview: interviews,
      applicationId: applications.id,
      applicationTitle: applications.title,
      companyName: companies.name,
    })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(interviews.id, id));

  if (!row) {
    return null;
  }

  const questions = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.interviewId, id))
    .orderBy(asc(interviewQuestions.createdAt));

  return { ...row, questions };
}

export interface QuestionBankEntry {
  question: InterviewQuestion;
  interviewId: string;
  round: string;
  companyName: string;
}

// 질문 은행은 저장소가 아니라 전체 질문의 파생 뷰다 — CONTEXT.md
export async function getQuestionBank(filter: {
  keyword?: string;
  tag?: string;
}): Promise<QuestionBankEntry[]> {
  const conditions = [];
  if (filter.keyword) {
    conditions.push(ilike(interviewQuestions.question, `%${filter.keyword}%`));
  }
  if (filter.tag) {
    conditions.push(arrayContains(interviewQuestions.tags, [filter.tag]));
  }

  return getDb()
    .select({
      question: interviewQuestions,
      interviewId: interviews.id,
      round: interviews.round,
      companyName: companies.name,
    })
    .from(interviewQuestions)
    .innerJoin(interviews, eq(interviewQuestions.interviewId, interviews.id))
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(interviewQuestions.createdAt));
}

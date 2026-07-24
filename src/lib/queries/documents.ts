import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  applicationDocuments,
  applications,
  companies,
  documents,
  type Document,
} from "@/lib/db/schema";

export interface DocumentWithUsage {
  document: Document;
  linkedApplications: { id: string; title: string; companyName: string }[];
}

/** 라이브러리 전체 문서 + 각 문서가 연결된 지원들 ("이 버전을 어디에 냈나") */
export async function getDocumentLibrary(userId: string): Promise<DocumentWithUsage[]> {
  const db = getDb();

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  const links = await db
    .select({
      documentId: applicationDocuments.documentId,
      applicationId: applications.id,
      title: applications.title,
      companyName: companies.name,
    })
    .from(applicationDocuments)
    .innerJoin(applications, eq(applicationDocuments.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.userId, userId));

  const linksByDocument = new Map<string, DocumentWithUsage["linkedApplications"]>();
  for (const link of links) {
    const list = linksByDocument.get(link.documentId) ?? [];
    list.push({ id: link.applicationId, title: link.title, companyName: link.companyName });
    linksByDocument.set(link.documentId, list);
  }

  return docs.map((document) => ({
    document,
    linkedApplications: linksByDocument.get(document.id) ?? [],
  }));
}

/** 한 지원에 연결된 문서들 ("이 지원에 뭘 냈나") */
export async function getDocumentsForApplication(
  applicationId: string,
  userId: string,
): Promise<Document[]> {
  return getDb()
    .select({ document: documents })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(and(eq(applicationDocuments.applicationId, applicationId), eq(documents.userId, userId)))
    .orderBy(desc(documents.createdAt))
    .then((rows) => rows.map((row) => row.document));
}

/** 아직 이 지원에 연결되지 않은 문서들 — 연결 선택지 */
export async function getUnlinkedDocuments(
  applicationId: string,
  userId: string,
): Promise<Document[]> {
  const linked = await getDb()
    .select({ documentId: applicationDocuments.documentId })
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId));
  const linkedIds = new Set(linked.map((row) => row.documentId));

  const all = await getDb()
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
  return all.filter((document) => !linkedIds.has(document.id));
}

export interface DocumentUsage {
  count: number;
  totalBytes: number;
}

/** 유저의 문서 사용량 — 비오너 스토리지 쿼터 검사에 쓴다 (ADR 0010) */
export async function getDocumentUsage(userId: string): Promise<DocumentUsage> {
  const [row] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
      totalBytes: sql<number>`coalesce(sum(${documents.fileSize}), 0)::bigint`,
    })
    .from(documents)
    .where(eq(documents.userId, userId));
  // bigint 는 postgres-js 에서 문자열로 올 수 있어 Number 로 정규화한다
  return { count: Number(row?.count ?? 0), totalBytes: Number(row?.totalBytes ?? 0) };
}

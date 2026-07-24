"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applicationDocuments, applications, documents, type DocumentKind } from "@/lib/db/schema";
import { sanitizeFileName, validateDocumentFile } from "@/lib/domain/document-file";
import { createStorageClient, DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { isUuid } from "@/lib/uuid";

const DOCUMENT_KINDS = ["resume", "portfolio", "cover_letter", "other"];

export async function uploadDocument(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "");
  const memo = String(formData.get("memo") ?? "").trim();
  const file = formData.get("file");

  if (!name) {
    redirect("/documents?error=missing-name");
  }
  if (!DOCUMENT_KINDS.includes(kindRaw)) {
    redirect("/documents?error=invalid-kind");
  }
  if (!(file instanceof File)) {
    redirect("/documents?error=missing-file");
  }

  const validation = validateDocumentFile(file.name, file.size);
  if (!validation.ok) {
    redirect(`/documents?error=${validation.reason}`);
  }

  // 파일 먼저 올리고, 성공하면 레코드를 만든다 — 실패 시 고아 레코드를 남기지 않기 위해 (ADR 0008)
  const storagePath = `${crypto.randomUUID()}/${sanitizeFileName(file.name)}`;
  const storage = createStorageClient();
  const { error: uploadError } = await storage.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    redirect("/documents?error=upload-failed");
  }

  await getDb()
    .insert(documents)
    .values({
      name,
      kind: kindRaw as DocumentKind,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      memo: memo || null,
    });

  revalidatePath("/documents");
  redirect("/documents");
}

export async function deleteDocument(documentId: string) {
  await requireUser();

  if (!isUuid(documentId)) {
    redirect("/documents");
  }

  const [doc] = await getDb()
    .select({ storagePath: documents.storagePath })
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc) {
    redirect("/documents");
  }

  // 파일 먼저 지우고 레코드를 지운다 — 순서가 반대면 경로를 잃은 고아 파일이 남는다 (ADR 0008).
  // 파일 제거가 실패하면 레코드를 남겨 재시도할 수 있게 한다 (레코드만 지우면 파일이 고아가 된다)
  const storage = createStorageClient();
  const { error: removeError } = await storage.storage
    .from(DOCUMENTS_BUCKET)
    .remove([doc.storagePath]);
  if (removeError) {
    redirect("/documents?error=delete-failed");
  }

  await getDb().delete(documents).where(eq(documents.id, documentId));

  revalidatePath("/documents");
  redirect("/documents");
}

export async function linkDocument(applicationId: string, formData: FormData) {
  await requireUser();

  const documentId = String(formData.get("documentId") ?? "");
  if (!isUuid(applicationId) || !isUuid(documentId)) {
    redirect("/");
  }

  // 지원·문서가 실제로 존재할 때만 연결한다
  const db = getDb();
  const [application] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, applicationId));
  const [document] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.id, documentId));

  if (application && document) {
    // 이미 연결돼 있으면 무시 (복합 PK 충돌)
    await db
      .insert(applicationDocuments)
      .values({ applicationId, documentId })
      .onConflictDoNothing();
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/documents");
  redirect(`/applications/${applicationId}`);
}

export async function unlinkDocument(applicationId: string, documentId: string) {
  await requireUser();

  if (!isUuid(applicationId) || !isUuid(documentId)) {
    redirect("/");
  }

  await getDb()
    .delete(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        eq(applicationDocuments.documentId, documentId),
      ),
    );

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/documents");
  redirect(`/applications/${applicationId}`);
}

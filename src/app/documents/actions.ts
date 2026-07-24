"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isOwner } from "@/lib/auth/owner";
import { ownsApplication } from "@/lib/auth/ownership";
import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { applicationDocuments, documents, type DocumentKind } from "@/lib/db/schema";
import {
  buildStorageKey,
  MAX_TOTAL_DOCUMENT_BYTES_PER_USER,
  validateDocumentFile,
} from "@/lib/domain/document-file";
import { getDocumentUsage } from "@/lib/queries/documents";
import { createStorageClient, DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { isUuid } from "@/lib/uuid";

const DOCUMENT_KINDS = ["resume", "portfolio", "cover_letter", "other"];

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();

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

  // 비오너(공개 가입자) 스토리지 총량 쿼터 — 남용/비용 방어 (ADR 0010). 오너는 면제된다.
  if (!isOwner(user.email)) {
    const usage = await getDocumentUsage(user.id);
    if (usage.totalBytes + file.size > MAX_TOTAL_DOCUMENT_BYTES_PER_USER) {
      redirect("/documents?error=quota-size");
    }
  }

  // 파일 먼저 올리고, 성공하면 레코드를 만든다 — 실패 시 고아 레코드를 남기지 않기 위해 (ADR 0008).
  // 키는 유저 폴더 + UUID+확장자(ASCII) — Supabase Storage는 한글 등 non-ASCII 키를 거부한다.
  // 본문은 ArrayBuffer로 넘겨 런타임별 File 스트리밍 차이를 없앤다.
  const storagePath = buildStorageKey(user.id, crypto.randomUUID(), file.name);
  const storage = createStorageClient();
  const { error: uploadError } = await storage.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadDocument] storage upload failed:", uploadError.message);
    redirect("/documents?error=upload-failed");
  }

  await getDb()
    .insert(documents)
    .values({
      userId: user.id,
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
  const user = await requireUser();

  if (!isUuid(documentId)) {
    redirect("/documents");
  }

  // 내 문서만 조회된다 — 남의 documentId 로는 not-found 처리된다
  const [doc] = await getDb()
    .select({ storagePath: documents.storagePath })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

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

  await getDb()
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

  revalidatePath("/documents");
  redirect("/documents");
}

export async function linkDocument(applicationId: string, formData: FormData) {
  const user = await requireUser();

  const documentId = String(formData.get("documentId") ?? "");
  if (!isUuid(applicationId) || !isUuid(documentId)) {
    redirect("/");
  }

  // 지원·문서가 둘 다 내 소유일 때만 연결한다
  const db = getDb();
  const application = await ownsApplication(user.id, applicationId);
  const [document] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

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
  const user = await requireUser();

  if (!isUuid(applicationId) || !isUuid(documentId)) {
    redirect("/");
  }

  // 내 지원이 아니면 아무것도 하지 않는다
  if (!(await ownsApplication(user.id, applicationId))) {
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

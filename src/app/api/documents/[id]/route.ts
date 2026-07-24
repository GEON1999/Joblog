import { eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { createStorageClient, DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { isUuid } from "@/lib/uuid";

// 이 라우트는 proxy 매처에 걸려 세션 보호를 받는다 — 로그인·화이트리스트 통과자만 도달한다.
// requireUser로 서버 액션과 동일한 심층 방어를 한 번 더 건다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();

  const { id } = await params;
  if (!isUuid(id)) {
    return new Response("Not found", { status: 404 });
  }

  const [doc] = await getDb()
    .select({ storagePath: documents.storagePath, fileName: documents.fileName })
    .from(documents)
    .where(eq(documents.id, id));

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  // 매 요청마다 짧은 수명(60초) 서명 URL을 새로 발급한다 (ADR 0008)
  const storage = createStorageClient();
  const { data, error } = await storage.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storagePath, 60, { download: doc.fileName });

  if (error || !data) {
    return new Response("Not available", { status: 502 });
  }

  return Response.redirect(data.signedUrl, 307);
}

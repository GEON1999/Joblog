import { eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { createStorageClient, DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { isUuid } from "@/lib/uuid";

// RFC 5987: 비ASCII 파일명은 filename*로 UTF-8 percent-encoding해 내려준다.
// Supabase 서명 URL의 download 옵션은 유니코드 이름을 이중 인코딩해 깨뜨리므로 직접 헤더를 만든다.
function contentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "download";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// 이 라우트는 proxy 매처에 걸려 세션 보호를 받는다. requireUser로 한 번 더 검증(심층 방어)하고,
// 파일은 서버가 스트리밍한다 — 공개 URL을 전혀 만들지 않는다 (ADR 0008).
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

  const storage = createStorageClient();
  const { data, error } = await storage.storage.from(DOCUMENTS_BUCKET).download(doc.storagePath);

  if (error || !data) {
    return new Response("Not available", { status: 502 });
  }

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Disposition": contentDisposition(doc.fileName),
      "Cache-Control": "private, no-store",
    },
  });
}

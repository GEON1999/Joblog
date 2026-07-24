import { describe, expect, it } from "vitest";

import { MAX_DOCUMENT_BYTES, sanitizeFileName, validateDocumentFile } from "./document-file";

describe("validateDocumentFile", () => {
  it("허용 확장자 + 적정 크기는 통과", () => {
    expect(validateDocumentFile("이력서.pdf", 1024)).toEqual({ ok: true });
    expect(validateDocumentFile("resume.DOCX", 1024)).toEqual({ ok: true });
  });

  it("빈 파일은 거부", () => {
    expect(validateDocumentFile("a.pdf", 0)).toEqual({ ok: false, reason: "empty" });
  });

  it("크기 초과는 거부", () => {
    expect(validateDocumentFile("a.pdf", MAX_DOCUMENT_BYTES + 1)).toEqual({
      ok: false,
      reason: "too-large",
    });
  });

  it("허용되지 않은 확장자는 거부", () => {
    expect(validateDocumentFile("malware.exe", 1024)).toEqual({
      ok: false,
      reason: "bad-extension",
    });
    expect(validateDocumentFile("확장자없음", 1024)).toEqual({
      ok: false,
      reason: "bad-extension",
    });
  });
});

describe("sanitizeFileName", () => {
  it("경로 구분자를 밀어내 경로 탈출을 막는다", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("etc_passwd");
    expect(sanitizeFileName("a/b\\c.pdf")).toBe("a_b_c.pdf");
  });

  it("공백을 밑줄로 바꾸고 한글·숫자는 보존한다", () => {
    expect(sanitizeFileName("이력서 v3 최종.pdf")).toBe("이력서_v3_최종.pdf");
  });

  it("선행 점을 제거한다", () => {
    expect(sanitizeFileName(".hidden.pdf")).toBe("hidden.pdf");
  });

  it("전부 제거되면 기본값 file", () => {
    expect(sanitizeFileName("///")).toBe("file");
  });
});

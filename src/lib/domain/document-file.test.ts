import { describe, expect, it } from "vitest";

import { buildStorageKey, MAX_DOCUMENT_BYTES, validateDocumentFile } from "./document-file";

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

describe("buildStorageKey", () => {
  const userId = "99999999-8888-7777-6666-555555555555";
  const uuid = "11111111-2222-3333-4444-555555555555";

  it("유저 폴더로 네임스페이싱한다 (멀티테넌시)", () => {
    expect(buildStorageKey(userId, uuid, "resume.pdf")).toBe(`${userId}/${uuid}.pdf`);
  });

  it("한글 파일명이어도 키는 ASCII(uuid + 확장자)만 담는다", () => {
    expect(buildStorageKey(userId, uuid, "이력서 v3 최종.pdf")).toBe(`${userId}/${uuid}.pdf`);
  });

  it("확장자는 소문자로 보존한다", () => {
    expect(buildStorageKey(userId, uuid, "resume.DOCX")).toBe(`${userId}/${uuid}.docx`);
  });

  it("확장자가 없으면 uuid만", () => {
    expect(buildStorageKey(userId, uuid, "noext")).toBe(`${userId}/${uuid}`);
  });

  it("경로 구분자가 든 파일명도 키에 새지 않는다 (경로 탈출 차단)", () => {
    expect(buildStorageKey(userId, uuid, "../../etc/passwd.pdf")).toBe(`${userId}/${uuid}.pdf`);
  });
});

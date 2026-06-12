import { describe, it, expect } from "vitest";
import { validateUpload } from "./upload-policy";

const MB = 1024 * 1024;

describe("validateUpload", () => {
  it("11MB pdf는 size 오류를 반환한다", () => {
    const result = validateUpload(
      { name: "resume.pdf", mimeType: "application/pdf", sizeBytes: 11 * MB },
      0,
    );
    expect(result).toEqual({ ok: false, reason: "size" });
  });

  it("exe 파일은 type 오류를 반환한다", () => {
    const result = validateUpload(
      {
        name: "malware.exe",
        mimeType: "application/octet-stream",
        sizeBytes: 1 * MB,
      },
      0,
    );
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("잘못된 MIME 타입은 type 오류를 반환한다", () => {
    const result = validateUpload(
      { name: "resume.pdf", mimeType: "text/plain", sizeBytes: 1 * MB },
      0,
    );
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("누적 45MB + 8MB는 quota 오류를 반환한다", () => {
    const result = validateUpload(
      { name: "resume.pdf", mimeType: "application/pdf", sizeBytes: 8 * MB },
      45 * MB,
    );
    expect(result).toEqual({ ok: false, reason: "quota" });
  });

  it("누적 40MB + 8MB는 통과한다", () => {
    const result = validateUpload(
      { name: "resume.pdf", mimeType: "application/pdf", sizeBytes: 8 * MB },
      40 * MB,
    );
    expect(result).toEqual({ ok: true });
  });

  it("정상 파일은 통과한다", () => {
    const result = validateUpload(
      { name: "photo.png", mimeType: "image/png", sizeBytes: 2 * MB },
      0,
    );
    expect(result).toEqual({ ok: true });
  });
});

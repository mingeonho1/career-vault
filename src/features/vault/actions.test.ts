import { describe, it, expect } from "vitest";
import { hasRrnInCardFields } from "@/features/vault/rrn-check";

describe("hasRrnInCardFields", () => {
  it("title에 RRN이 포함된 경우 저장을 거부한다", () => {
    expect(
      hasRrnInCardFields({
        title: "900101-1234567",
        organization: "회사",
        detail: null,
      }),
    ).toBe(true);
  });

  it("organization에 RRN이 포함된 경우 저장을 거부한다", () => {
    expect(
      hasRrnInCardFields({
        title: "정상 제목",
        organization: "900101-1234567이 포함된 기관",
        detail: null,
      }),
    ).toBe(true);
  });

  it("정상 카드는 RRN 감지를 하지 않는다", () => {
    expect(
      hasRrnInCardFields({
        title: "소프트웨어 공학 학사",
        organization: "서울대학교",
        detail: null,
      }),
    ).toBe(false);
  });

  it("detail 값에 RRN이 포함된 경우 저장을 거부한다", () => {
    expect(
      hasRrnInCardFields({
        title: "정상 제목",
        organization: "정상 기관",
        detail: { 증명번호: "900101-1234567" },
      }),
    ).toBe(true);
  });

  it("detail 값에 RRN이 있을 때 저장을 거부한다 (우회 봉쇄)", () => {
    expect(
      hasRrnInCardFields({
        title: "정상 제목",
        organization: "정상 기관",
        detail: { 주민번호: "900101-1234567" },
      }),
    ).toBe(true);
  });

  it("detail 키에 RRN이 포함된 경우 저장을 거부한다", () => {
    expect(
      hasRrnInCardFields({
        title: "정상 제목",
        organization: "정상 기관",
        detail: { "900101-1234567": "주민등록번호" },
      }),
    ).toBe(true);
  });
});

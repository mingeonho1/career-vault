import { describe, it, expect } from "vitest";
import { extractedCardSchema } from "@/features/vault/schema";

describe("extractedCardSchema", () => {
  it("정상 AI 응답 JSON을 파싱하고 타입을 보장한다 (T7)", () => {
    const valid = {
      category: "education",
      title: "학사",
      organization: "서울대학교",
      start_date: "2018-03-01",
      end_date: "2022-02-28",
      detail: null,
    };
    const result = extractedCardSchema.parse(valid);
    expect(result.category).toBe("education");
    expect(result.start_date).toBe("2018-03-01");
  });

  it("잘못된 category는 파싱에 실패한다 (T8)", () => {
    const invalid = {
      category: "invalid_category",
      title: "학사",
      organization: "서울대학교",
    };
    expect(() => extractedCardSchema.parse(invalid)).toThrow();
  });

  it("잘못된 날짜 형식은 파싱에 실패한다 (T8)", () => {
    const invalid = {
      category: "education",
      title: "학사",
      organization: "서울대학교",
      start_date: "2018/03/01",
    };
    expect(() => extractedCardSchema.parse(invalid)).toThrow();
  });
});

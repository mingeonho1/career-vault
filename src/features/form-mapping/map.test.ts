import { describe, it, expect } from "vitest";
import { formAnswerResponseSchema } from "./schema";

describe("formAnswerResponseSchema — T11", () => {
  it("정상 응답 파싱 성공", () => {
    const raw = {
      answers: [
        {
          question: "최종 학력",
          answer: "서울대학교 컴퓨터공학과 (2020-03-01 ~ 2024-02-28)",
        },
        { question: "병역", answer: null },
      ],
    };
    expect(() => formAnswerResponseSchema.parse(raw)).not.toThrow();
    const parsed = formAnswerResponseSchema.parse(raw);
    expect(parsed.answers).toHaveLength(2);
    // toHaveLength(2)로 길이를 검증한 뒤 at()으로 접근 — undefined 분기 불필요
    expect(parsed.answers.at(1)?.answer).toBeNull();
  });

  it("answers 배열이 없으면 파싱 실패", () => {
    expect(() => formAnswerResponseSchema.parse({ wrong: [] })).toThrow();
  });

  it("answer 필드가 string | null 아닌 타입이면 파싱 실패", () => {
    const raw = { answers: [{ question: "학력", answer: 123 }] };
    expect(() => formAnswerResponseSchema.parse(raw)).toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { detectRrn } from "./rrn";

describe("detectRrn", () => {
  it("표준 하이픈 패턴을 감지한다", () => {
    expect(detectRrn("900101-1234567")).toBe(true);
  });

  it("공백 포함 하이픈 패턴을 감지한다", () => {
    expect(detectRrn("900101 - 1234567")).toBe(true);
  });

  it("en-dash 패턴을 감지한다", () => {
    expect(detectRrn("900101–1234567")).toBe(true);
  });

  it("전화번호는 감지하지 않는다", () => {
    expect(detectRrn("010-1234-5678")).toBe(false);
  });

  it("사업자번호는 감지하지 않는다", () => {
    expect(detectRrn("123-45-67890")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { waitlistSchema } from "./schema";

describe("waitlistSchema — T10", () => {
  it("올바른 이메일은 통과", () => {
    expect(() =>
      waitlistSchema.parse({ email: "test@example.com" }),
    ).not.toThrow();
  });

  it("잘못된 이메일 형식은 거부", () => {
    expect(() => waitlistSchema.parse({ email: "not-an-email" })).toThrow();
  });

  it("이메일 없음도 거부", () => {
    expect(() => waitlistSchema.parse({ email: "" })).toThrow();
  });
});

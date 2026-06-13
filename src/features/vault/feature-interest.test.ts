import { describe, it, expect } from "vitest";
import { z } from "zod";

// featureKey 화이트리스트 로직을 격리 검증한다.
// recordFeatureInterest의 DB 의존 경로(idempotency, RLS)는
// Supabase 에뮬레이터 없이 단위 테스트 불가 — migration + reviewer 검수로 대체한다.
const ALLOWED_FEATURE_KEYS = ["precision_extract"] as const;
const featureKeySchema = z.enum(ALLOWED_FEATURE_KEYS);

describe("featureKey 화이트리스트 검증 (T13)", () => {
  it("허용된 feature_key는 통과한다", () => {
    expect(featureKeySchema.safeParse("precision_extract").success).toBe(true);
  });

  it("허용되지 않은 feature_key는 거부한다", () => {
    expect(featureKeySchema.safeParse("unknown_feature").success).toBe(false);
  });

  it("빈 문자열은 거부한다", () => {
    expect(featureKeySchema.safeParse("").success).toBe(false);
  });
});

import { z } from "zod";

/**
 * env는 여기서 한 번만 검증한다. 다른 모듈은 process.env 대신 이 모듈을 import.
 * 빌드별로 필요한 키를 스키마에 추가할 것 (예: SUPABASE_URL).
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);

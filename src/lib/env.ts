import { z } from "zod";

/**
 * env는 여기서 한 번만 검증한다. 다른 모듈은 process.env 대신 이 모듈을 import.
 * SUPABASE_SECRET_KEY, GEMINI_API_KEY는 서버 전용 — 클라이언트 번들에 노출되지 않는다.
 */
const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "SUPABASE_PUBLISHABLE_KEY is required"),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  SITE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

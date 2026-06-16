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
  SITE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

/**
 * 실행 환경에 맞는 베이스 URL을 반환한다.
 * 우선순위: SITE_URL env → VERCEL_PROJECT_PRODUCTION_URL → localhost:3000
 */
export function siteUrl(): string {
  if (env.SITE_URL) return env.SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

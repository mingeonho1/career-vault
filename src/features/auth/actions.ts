"use server";

import { headers } from "next/headers";

import { loginSchema } from "@/features/auth/schema";
import { createSupabaseServerClient } from "@/lib/db-server";
import { env } from "@/lib/env";

type SendMagicLinkResult = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(
  formData: FormData,
): Promise<SendMagicLinkResult> {
  const raw = { email: formData.get("email") };
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "이메일을 확인해주세요",
    };
  }

  // 요청 Origin 헤더에서 베이스 URL을 도출한다.
  // server action은 브라우저 POST이므로 Origin 헤더가 항상 오지만,
  // 없는 경우(직접 API 호출 등)에는 env.SITE_URL로 폴백한다.
  const requestHeaders = await headers();
  const base = requestHeaders.get("origin") ?? env.SITE_URL;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${base}/auth/callback`,
    },
  });

  if (error) {
    console.error("[sendMagicLink] Supabase auth error", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      error:
        error.status === 429
          ? "인증 메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요."
          : "링크 발송에 실패했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return { ok: true };
}

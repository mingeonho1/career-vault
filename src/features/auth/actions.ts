"use server";

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

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      ok: false,
      error: "링크 발송에 실패했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return { ok: true };
}

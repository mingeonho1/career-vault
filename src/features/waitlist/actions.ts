"use server";
import { createSupabaseServerClient } from "@/lib/db-server";
import { waitlistSchema } from "./schema";

export async function joinWaitlist(
  formData: FormData,
): Promise<
  { ok: true; alreadyExists?: boolean } | { ok: false; error: string }
> {
  const parsed = waitlistSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "이메일을 확인해주세요",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: parsed.data.email });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, alreadyExists: true };
    }
    return {
      ok: false,
      error: "등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return { ok: true };
}

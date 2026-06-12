"use server";
import { z } from "zod";
import { mapFormToAnswers } from "./map";
import type { FormAnswerDraft } from "./schema";
import { careerCardSchema } from "@/features/vault/schema";
import type { CareerCard } from "@/features/vault/schema";
import { createSupabaseServerClient } from "@/lib/db-server";

const runFormMappingSchema = z.object({
  formText: z.string().min(1, "양식 텍스트를 입력해주세요."),
  cards: z.array(careerCardSchema),
});

export async function runFormMapping(
  formText: string,
  cards: CareerCard[],
): Promise<
  { ok: true; answers: FormAnswerDraft[] } | { ok: false; error: string }
> {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const parsed = runFormMappingSchema.safeParse({ formText, cards });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않아요.",
    };
  }
  try {
    const answers = await mapFormToAnswers(formText, cards);
    return { ok: true, answers };
  } catch {
    return {
      ok: false,
      error: "AI 매칭 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
    };
  }
}

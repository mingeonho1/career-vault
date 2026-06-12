"use server";
import { createSupabaseServerClient } from "@/lib/db-server";
import { saveCardSchema } from "@/features/vault/schema";
import { hasRrnInCardFields } from "@/features/vault/rrn-check";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function insertCard(
  sb: SupabaseClient,
  userId: string,
  parsed: ReturnType<typeof saveCardSchema.parse>,
) {
  const { data, error } = await sb
    .from("career_cards")
    .insert({ user_id: userId, ...parsed })
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function saveCard(
  input: unknown,
): Promise<{ ok: true; cardId: string } | { ok: false; error: string }> {
  const parsed = saveCardSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "입력 형식이 올바르지 않아요." };

  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  if (
    hasRrnInCardFields({
      title: parsed.data.title,
      organization: parsed.data.organization,
      detail: parsed.data.detail,
    })
  ) {
    return {
      ok: false,
      error:
        "주민등록번호는 저장할 수 없어요. 해당 부분을 지우고 다시 저장해 주세요.",
    };
  }

  const cardId = await insertCard(sb, user.id, parsed.data);
  if (!cardId)
    return {
      ok: false,
      error: "카드 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
    };

  if (parsed.data.source_document_id) {
    await sb
      .from("documents")
      .update({ status: "extracted" })
      .eq("id", parsed.data.source_document_id);
  }
  return { ok: true, cardId };
}

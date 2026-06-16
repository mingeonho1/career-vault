import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CareerCard } from "@/features/vault/schema";

export async function fetchUserCards(
  supabase: SupabaseClient,
): Promise<CareerCard[]> {
  const { data, error } = await supabase
    .from("career_vault_career_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("카드 목록을 불러오는 데 실패했어요.");
  return data as CareerCard[];
}

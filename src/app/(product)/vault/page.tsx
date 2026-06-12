import { createSupabaseServerClient } from "@/lib/db-server";
import { fetchUserCards } from "@/features/vault/queries";
import { UploadSection } from "@/features/vault/ui/upload-section";
import { CardList } from "@/features/vault/ui/card-list";
import { FormMapper } from "@/features/form-mapping/ui/form-mapper";

export default async function VaultPage() {
  const supabase = await createSupabaseServerClient();
  const cards = await fetchUserCards(supabase);
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-10">
      <UploadSection />
      <CardList initialCards={cards} />
      <FormMapper cards={cards} />
    </main>
  );
}

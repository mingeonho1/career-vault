"use server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/db-server";
import { uploadFileSchema, type ExtractedCard } from "@/features/vault/schema";
import { validateUpload } from "@/features/vault/upload-policy";
import { extractCardsFromDocument } from "@/features/vault/extract";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type UploadResult =
  | { ok: true; documentId: string; signedUrl: string }
  | { ok: false; error: string };

const UPLOAD_ERRORS = {
  type: "PDF, PNG, JPG 파일만 업로드할 수 있어요.",
  size: "파일 크기는 10MB를 넘을 수 없어요.",
  quota: "저장 공간이 부족해요. 총 50MB까지 사용할 수 있어요.",
} as const;

async function getUsageBytes(
  sb: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await sb
    .from("documents")
    .select("size_bytes")
    .eq("user_id", userId);
  if (error) return null;
  return (data as { size_bytes: number }[]).reduce(
    (s, r) => s + r.size_bytes,
    0,
  );
}

async function storeFile(sb: SupabaseClient, file: File, path: string) {
  const buf = await file.arrayBuffer();
  const { error } = await sb.storage
    .from("certificates")
    .upload(path, buf, { contentType: file.type });
  if (error) {
    console.error("[uploadFile] storage upload error", {
      message: error.message,
      name: error.name,
    });
    return null;
  }
  const { data, error: urlError } = await sb.storage
    .from("certificates")
    .createSignedUrl(path, 3600);
  if (urlError) {
    console.error("[uploadFile] createSignedUrl error", {
      message: urlError.message,
      name: urlError.name,
    });
    return null;
  }
  return data?.signedUrl ?? "";
}

async function insertDoc(
  sb: SupabaseClient,
  p: { userId: string; path: string; name: string; mime: string; size: number },
) {
  const { data, error } = await sb
    .from("documents")
    .insert({
      user_id: p.userId,
      storage_path: p.path,
      file_name: p.name,
      mime_type: p.mime,
      size_bytes: p.size,
      status: "uploaded",
    })
    .select("id");
  if (error || !data?.[0]) return null;
  return (data[0] as { id: string }).id;
}

function err(msg: string): { ok: false; error: string } {
  return { ok: false, error: msg };
}

async function checkFileAndPolicy(
  sb: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ ok: false; error: string } | null> {
  const v = uploadFileSchema.safeParse({
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!v.success) return err("파일 형식을 확인해 주세요.");
  const usage = await getUsageBytes(sb, userId);
  if (usage === null)
    return err("사용량 확인에 실패했어요. 잠시 후 다시 시도해 주세요.");
  const policy = validateUpload(
    { name: file.name, mimeType: file.type, sizeBytes: file.size },
    usage,
  );
  if (!policy.ok) return err(UPLOAD_ERRORS[policy.reason]);
  return null;
}

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return err("로그인이 필요해요.");

  const file = formData.get("file");
  if (!(file instanceof File)) return err("파일을 선택해 주세요.");

  const policyErr = await checkFileAndPolicy(sb, user.id, file);
  if (policyErr) return policyErr;

  const MIME_TO_EXT: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
  };
  const ext = MIME_TO_EXT[file.type];
  if (!ext) return err("지원하지 않는 파일 형식이에요.");
  const storagePath = `${user.id}/${Date.now()}-${globalThis.crypto.randomUUID()}.${ext}`;
  const signedUrl = await storeFile(sb, file, storagePath);
  if (signedUrl === null)
    return err("파일 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.");

  const documentId = await insertDoc(sb, {
    userId: user.id,
    path: storagePath,
    name: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!documentId)
    return err("파일 정보 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");

  return { ok: true, documentId, signedUrl };
}

async function fetchDocForExtract(
  sb: SupabaseClient,
  documentId: string,
  userId: string,
) {
  const { data, error } = await sb
    .from("documents")
    .select("storage_path, mime_type")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data as { storage_path: string; mime_type: string };
}

async function markFailed(sb: SupabaseClient, documentId: string) {
  await sb.from("documents").update({ status: "failed" }).eq("id", documentId);
}

type ExtractDocInput = { storage_path: string; mime_type: string };

async function downloadAndExtract(
  sb: SupabaseClient,
  documentId: string,
  doc: ExtractDocInput,
): Promise<
  { ok: true; cards: ExtractedCard[] } | { ok: false; error: string }
> {
  const { data: blob, error: dlErr } = await sb.storage
    .from("certificates")
    .download(doc.storage_path);
  if (dlErr || !blob) {
    await markFailed(sb, documentId);
    return {
      ok: false,
      error: "파일 다운로드에 실패했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const cards = await extractCardsFromDocument({
      bytes,
      mimeType: doc.mime_type,
    });
    return { ok: true, cards };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[extract] failed", { name: e.name, message: e.message });
    await markFailed(sb, documentId);
    return {
      ok: false,
      error: "카드 추출 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}

export async function extractAndSaveDocument(
  documentId: string,
): Promise<
  { ok: true; cards: ExtractedCard[] } | { ok: false; error: string }
> {
  const idParsed = z.string().uuid().safeParse(documentId);
  if (!idParsed.success) {
    return { ok: false, error: "잘못된 문서 ID예요." };
  }
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const doc = await fetchDocForExtract(sb, documentId, user.id);
  if (!doc) return { ok: false, error: "문서를 찾을 수 없어요." };
  return downloadAndExtract(sb, documentId, doc);
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_QUOTA_BYTES = 50 * 1024 * 1024; // 50MB

type UploadValidationResult =
  | { ok: true }
  | { ok: false; reason: "type" | "size" | "quota" };

function extractExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export function validateUpload(
  file: { name: string; mimeType: string; sizeBytes: number },
  currentUsageBytes: number,
): UploadValidationResult {
  const extension = extractExtension(file.name);
  const isValidType =
    ALLOWED_MIME_TYPES.has(file.mimeType) && ALLOWED_EXTENSIONS.has(extension);

  if (!isValidType) {
    return { ok: false, reason: "type" };
  }

  if (file.sizeBytes > MAX_FILE_BYTES) {
    return { ok: false, reason: "size" };
  }

  if (currentUsageBytes + file.sizeBytes > MAX_QUOTA_BYTES) {
    return { ok: false, reason: "quota" };
  }

  return { ok: true };
}

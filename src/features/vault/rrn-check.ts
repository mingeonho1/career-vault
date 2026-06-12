import { detectRrn } from "@/features/vault/rrn";

export function hasRrnInCardFields(fields: {
  title: string;
  organization: string;
  detail: Record<string, string> | null | undefined;
}): boolean {
  if (detectRrn(fields.title)) return true;
  if (detectRrn(fields.organization)) return true;
  if (!fields.detail) return false;
  return Object.entries(fields.detail).some(
    ([k, v]) => detectRrn(k) || detectRrn(v),
  );
}

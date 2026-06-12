import { z } from "zod";

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

const CATEGORY_VALUES = [
  "education",
  "certificate",
  "military",
  "career",
  "language",
  "etc",
] as const;

export const extractedCardSchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  title: z.string(),
  organization: z.string(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  detail: z.record(z.string(), z.string()).nullable().optional(),
});

export type ExtractedCard = z.infer<typeof extractedCardSchema>;

export const extractedCardsResponseSchema = z.object({
  cards: z.array(extractedCardSchema),
});

export const saveCardSchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  title: z.string().min(1),
  organization: z.string().min(1),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  detail: z.record(z.string(), z.string()).nullable().optional(),
  source_document_id: z.string().uuid().nullable().optional(),
});

export const careerCardSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category: z.enum(CATEGORY_VALUES),
  title: z.string(),
  organization: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  detail: z.record(z.string(), z.string()).nullable(),
  source_document_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type CareerCard = z.infer<typeof careerCardSchema>;

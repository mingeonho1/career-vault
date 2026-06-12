import { z } from "zod";

export const formAnswerDraftSchema = z.object({
  question: z.string(),
  answer: z.string().nullable(),
});

export type FormAnswerDraft = z.infer<typeof formAnswerDraftSchema>;

export const formAnswerResponseSchema = z.object({
  answers: z.array(formAnswerDraftSchema),
});

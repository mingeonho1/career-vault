import "server-only";
import { GoogleGenAI, type Schema, Type } from "@google/genai";
import { env } from "@/lib/env";
import { formAnswerResponseSchema, type FormAnswerDraft } from "./schema";
import type { CareerCard } from "@/features/vault/schema";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING, nullable: true },
        },
        required: ["question", "answer"],
      },
    },
  },
  required: ["answers"],
};

export async function mapFormToAnswers(
  formText: string,
  cards: CareerCard[],
): Promise<FormAnswerDraft[]> {
  const cardsJson = JSON.stringify(cards);
  const prompt = `다음은 지원서 양식 텍스트입니다:\n\n${formText}\n\n다음은 사용자의 이력 카드 데이터입니다:\n\n${cardsJson}\n\n양식의 각 항목을 파악하고, 이력 카드 데이터에서 해당 항목에 맞는 답을 찾아 매칭하세요. 카드 데이터에 없는 항목은 answer를 null로 반환하세요.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("빈 응답");
  const parsed = formAnswerResponseSchema.parse(JSON.parse(text));
  return parsed.answers;
}

import "server-only";
import { GoogleGenAI, type Schema, Type } from "@google/genai";
import { env } from "@/lib/env";
import {
  extractedCardsResponseSchema,
  type ExtractedCard,
} from "@/features/vault/schema";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: [
              "education",
              "certificate",
              "military",
              "career",
              "language",
              "etc",
            ],
          },
          title: { type: Type.STRING },
          organization: { type: Type.STRING },
          start_date: { type: Type.STRING, nullable: true },
          end_date: { type: Type.STRING, nullable: true },
          detail: { type: Type.OBJECT, nullable: true },
        },
        required: ["category", "title", "organization"],
      },
    },
  },
  required: ["cards"],
};

export async function extractCardsFromDocument(file: {
  bytes: Uint8Array;
  mimeType: string;
}): Promise<ExtractedCard[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.mimeType,
                data: Buffer.from(file.bytes).toString("base64"),
              },
            },
            {
              text: "이 증명서 문서에서 이력 정보를 추출하여 JSON으로 반환하세요. 학력, 자격증, 병역, 경력, 어학 정보를 각각 카드로 분리하세요. 날짜는 YYYY-MM-DD 형식으로 변환하세요. 정확하지 않은 날짜는 null로 설정하세요.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    const text = response.text;
    if (!text) throw new Error("빈 응답");
    const parsed = extractedCardsResponseSchema.parse(JSON.parse(text));
    return parsed.cards;
  } catch {
    throw new Error(
      "문서에서 정보를 추출하는 중 오류가 발생했어요. 직접 입력해 주세요.",
    );
  }
}

import "server-only";
import { GoogleGenAI, type Schema, Type } from "@google/genai";
import { env } from "@/lib/env";
import {
  extractedCardsResponseSchema,
  type ExtractedCard,
} from "@/features/vault/schema";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// Gemini structured output은 properties 없는 빈 OBJECT를 400 에러로 거부한다.
// detail을 key/value 쌍의 배열로 정의하고, 응답 후 Record<string,string>으로 변환한다.
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
          detail: {
            type: Type.ARRAY,
            nullable: true,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["category", "title", "organization"],
      },
    },
  },
  required: ["cards"],
};

type GeminiDetailEntry = { key: string; value: string };
type GeminiCard = {
  category: string;
  title: string;
  organization: string;
  start_date?: string | null;
  end_date?: string | null;
  detail?: GeminiDetailEntry[] | null;
};
type GeminiResponse = { cards: GeminiCard[] };

function detailArrayToRecord(
  entries: GeminiDetailEntry[] | null | undefined,
): Record<string, string> | null {
  if (!entries || entries.length === 0) return null;
  const record: Record<string, string> = {};
  for (const { key, value } of entries) {
    // 빈 value 항목은 제외, 중복 key는 마지막 값 우선
    if (value !== "") record[key] = value;
  }
  return Object.keys(record).length > 0 ? record : null;
}

function buildContents(file: { bytes: Uint8Array; mimeType: string }) {
  return [
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
  ];
}

async function callGemini(
  file: { bytes: Uint8Array; mimeType: string },
  model: string,
): Promise<string> {
  let text: string | undefined;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildContents(file),
      config: { responseMimeType: "application/json", responseSchema },
    });
    text = response.text ?? undefined;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[extract] gemini error", {
      name: e.name,
      message: e.message,
    });
    throw new Error(
      "문서에서 정보를 추출하는 중 오류가 발생했어요. 직접 입력해 주세요.",
    );
  }

  if (!text) {
    console.error("[extract] gemini error", {
      name: "EmptyResponse",
      message: "빈 응답",
    });
    throw new Error(
      "문서에서 정보를 추출하는 중 오류가 발생했어요. 직접 입력해 주세요.",
    );
  }

  return text;
}

function parseCards(text: string): ExtractedCard[] {
  try {
    const raw = JSON.parse(text) as GeminiResponse;
    const normalized = {
      cards: raw.cards.map((card) => ({
        ...card,
        detail: detailArrayToRecord(card.detail),
      })),
    };
    const parsed = extractedCardsResponseSchema.parse(normalized);
    return parsed.cards;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[extract] parse error", {
      name: e.name,
      message: e.message,
      text,
    });
    throw new Error(
      "문서에서 정보를 추출하는 중 오류가 발생했어요. 직접 입력해 주세요.",
    );
  }
}

export async function extractCardsFromDocument(
  file: { bytes: Uint8Array; mimeType: string },
  model = "gemini-3.1-flash-lite",
): Promise<ExtractedCard[]> {
  const text = await callGemini(file, model);
  return parseCards(text);
}

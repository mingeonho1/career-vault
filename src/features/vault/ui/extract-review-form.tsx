"use client";
import { useState } from "react";
import type { ExtractedCard } from "@/features/vault/schema";
import { saveCard } from "@/features/vault/card-actions";
import { ManualCardForm } from "@/features/vault/ui/manual-card-form";
import { DetailEditor } from "@/features/vault/ui/detail-editor";

const CATEGORY_LABELS = {
  education: "학력",
  certificate: "자격증",
  military: "병역",
  career: "경력",
  language: "어학",
  etc: "기타",
} as const;

type Category = keyof typeof CATEGORY_LABELS;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const INPUT_CLS = "bg-surface border border-border rounded-xl h-12 px-4";

type CardState = {
  category: Category;
  title: string;
  organization: string;
  start_date: string;
  end_date: string;
  detail: Record<string, string>;
};

function toCardState(card: ExtractedCard): CardState {
  return {
    category: card.category as Category,
    title: card.title,
    organization: card.organization,
    start_date: card.start_date ?? "",
    end_date: card.end_date ?? "",
    detail: card.detail ?? {},
  };
}

type CardEditorProps = {
  state: CardState;
  error: string | null;
  onChange: (field: keyof Omit<CardState, "detail">, value: string) => void;
  onDetailChange: (detail: Record<string, string>) => void;
};

function CardEditor({
  state,
  error,
  onChange,
  onDetailChange,
}: CardEditorProps) {
  return (
    <div className="bg-surface rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">분류</label>
        <select
          value={state.category}
          onChange={(e) => onChange("category", e.target.value)}
          className={INPUT_CLS}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">명칭</label>
        <input
          value={state.title}
          onChange={(e) => onChange("title", e.target.value)}
          required
          className={INPUT_CLS}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">기관</label>
        <input
          value={state.organization}
          onChange={(e) => onChange("organization", e.target.value)}
          required
          className={INPUT_CLS}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">시작일</label>
        <input
          value={state.start_date}
          onChange={(e) => onChange("start_date", e.target.value)}
          placeholder="YYYY-MM-DD"
          className={INPUT_CLS}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">종료일</label>
        <input
          value={state.end_date}
          onChange={(e) => onChange("end_date", e.target.value)}
          placeholder="YYYY-MM-DD"
          className={INPUT_CLS}
        />
      </div>
      <DetailEditor detail={state.detail} onChange={onDetailChange} />
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}

type Props = { cards: ExtractedCard[]; documentId: string };

export function ExtractReviewForm({ cards, documentId }: Props) {
  const [states, setStates] = useState<CardState[]>(() =>
    cards.map(toCardState),
  );
  const [errors, setErrors] = useState<(string | null)[]>(() =>
    cards.map(() => null),
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  if (cards.length === 0) return <ManualCardForm documentId={documentId} />;

  function updateField(
    idx: number,
    field: keyof Omit<CardState, "detail">,
    value: string,
  ) {
    setStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  }

  function updateDetail(idx: number, detail: Record<string, string>) {
    setStates((prev) => prev.map((s, i) => (i === idx ? { ...s, detail } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const newErrors: (string | null)[] = states.map(() => null);
    let allOk = true;
    for (let i = 0; i < states.length; i++) {
      const s = states[i] as CardState;
      const result = await saveCard({
        category: s.category,
        title: s.title,
        organization: s.organization,
        start_date: s.start_date || null,
        end_date: s.end_date || null,
        detail: s.detail,
        source_document_id: documentId,
      });
      if (!result.ok) {
        newErrors[i] = result.error;
        allOk = false;
      }
    }
    setErrors(newErrors);
    setLoading(false);
    if (allOk) setSaved(true);
  }

  if (saved) return <p className="text-primary font-medium">저장되었어요.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {states.map((s, idx) => (
        <CardEditor
          key={idx}
          state={s}
          error={errors[idx] ?? null}
          onChange={(f, v) => updateField(idx, f, v)}
          onDetailChange={(d) => updateDetail(idx, d)}
        />
      ))}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white font-semibold rounded-xl h-12 px-5"
      >
        {loading ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

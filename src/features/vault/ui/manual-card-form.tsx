"use client";
import { useState } from "react";
import { saveCard } from "@/features/vault/card-actions";
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

type FormState = {
  category: Category;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  detail: Record<string, string>;
};

type CardFormBodyProps = {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  error: string | null;
  loading: boolean;
};

function CardFormBody({ form, setField, error, loading }: CardFormBodyProps) {
  return (
    <>
      <h2 className="text-lg font-semibold">직접 입력</h2>
      <Field label="분류">
        <select
          value={form.category}
          onChange={(e) => setField("category", e.target.value as Category)}
          className={INPUT_CLS}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="명칭">
        <input
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          required
          className={INPUT_CLS}
        />
      </Field>
      <Field label="기관">
        <input
          value={form.organization}
          onChange={(e) => setField("organization", e.target.value)}
          required
          className={INPUT_CLS}
        />
      </Field>
      <Field label="시작일">
        <input
          value={form.startDate}
          onChange={(e) => setField("startDate", e.target.value)}
          placeholder="YYYY-MM-DD"
          className={INPUT_CLS}
        />
      </Field>
      <Field label="종료일">
        <input
          value={form.endDate}
          onChange={(e) => setField("endDate", e.target.value)}
          placeholder="YYYY-MM-DD"
          className={INPUT_CLS}
        />
      </Field>
      <DetailEditor
        detail={form.detail}
        onChange={(d) => setField("detail", d)}
      />
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white font-semibold rounded-xl h-12 px-5"
      >
        {loading ? "저장 중..." : "저장"}
      </button>
    </>
  );
}

type Props = { documentId?: string };

export function ManualCardForm({ documentId }: Props) {
  const [form, setForm] = useState<FormState>({
    category: "education",
    title: "",
    organization: "",
    startDate: "",
    endDate: "",
    detail: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await saveCard({
      category: form.category,
      title: form.title,
      organization: form.organization,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      detail: form.detail,
      source_document_id: documentId ?? null,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  if (saved) return <p className="text-primary font-medium">저장되었어요.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CardFormBody
        form={form}
        setField={setField}
        error={error}
        loading={loading}
      />
    </form>
  );
}

"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { runFormMapping } from "../actions";
import type { FormAnswerDraft } from "../schema";
import type { CareerCard } from "@/features/vault/schema";

type State =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "result"; answers: FormAnswerDraft[] };

function AnswerItem({
  item,
  index,
  copiedIndex,
  onCopy,
}: {
  item: FormAnswerDraft;
  index: number;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-white px-4 py-3 flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-sub">{item.question}</span>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-ink">
          {item.answer ?? <span className="text-ink-weak">데이터 없음</span>}
        </span>
        {item.answer !== null && (
          <button
            type="button"
            onClick={() => onCopy(item.answer!, index)}
            className="shrink-0 text-ink-sub hover:text-primary transition-colors"
            aria-label="복사"
          >
            {copiedIndex === index ? (
              <Check size={16} className="text-primary" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        )}
      </div>
    </li>
  );
}

export function FormMapper({ cards }: { cards: CareerCard[] }) {
  const [formText, setFormText] = useState("");
  const [state, setState] = useState<State>({ type: "idle" });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function submitMapping() {
    setState({ type: "loading" });
    const result = await runFormMapping(formText, cards);
    if (!result.ok) {
      setState({ type: "error", message: result.error });
    } else {
      setState({ type: "result", answers: result.answers });
    }
  }

  async function copyAnswer(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <section className="bg-surface rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">양식 자동 매칭</h2>
      <textarea
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-weak resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={6}
        placeholder="지원서 양식 텍스트를 붙여넣으세요"
        value={formText}
        onChange={(e) => setFormText(e.target.value)}
        disabled={state.type === "loading"}
      />
      <button
        type="button"
        onClick={submitMapping}
        disabled={state.type === "loading" || !formText.trim()}
        className="self-start h-12 bg-primary text-white font-semibold rounded-xl px-5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary-strong active:scale-[0.98]"
      >
        {state.type === "loading" ? "매칭 중..." : "매칭하기"}
      </button>
      {state.type === "error" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-danger">{state.message}</p>
          <button
            type="button"
            onClick={submitMapping}
            className="self-start text-sm text-primary underline"
          >
            다시 시도하기
          </button>
        </div>
      )}
      {state.type === "result" && (
        <ul className="flex flex-col gap-3">
          {state.answers.map((item, i) => (
            <AnswerItem
              key={i}
              item={item}
              index={i}
              copiedIndex={copiedIndex}
              onCopy={copyAnswer}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

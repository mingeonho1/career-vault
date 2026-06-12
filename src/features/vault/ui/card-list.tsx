"use client";
import { useState } from "react";
import { Copy } from "lucide-react";
import type { CareerCard } from "@/features/vault/schema";

const CATEGORY_LABELS: Record<CareerCard["category"], string> = {
  education: "학력",
  certificate: "자격증",
  military: "병역",
  career: "경력",
  language: "어학",
  etc: "기타",
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  if (start && !end) return start;
  if (!start && end) return `~ ${end}`;
  return `${start} ~ ${end}`;
}

type CopyButtonProps = { value: string; copyKey: string };

function CopyButton({ value, copyKey }: CopyButtonProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(copyKey);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs text-ink-weak hover:text-ink transition-colors"
      aria-label="복사"
    >
      {copiedKey === copyKey ? "복사됨" : <Copy size={14} />}
    </button>
  );
}

type CardItemProps = { card: CareerCard };

function CardItem({ card }: CardItemProps) {
  const dateRange = formatDateRange(card.start_date, card.end_date);
  return (
    <div className="bg-surface rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{card.title}</span>
        <CopyButton value={card.title} copyKey={`${card.id}-title`} />
      </div>
      <div className="flex items-center justify-between text-sm text-ink-sub">
        <span>{card.organization}</span>
        <CopyButton
          value={card.organization}
          copyKey={`${card.id}-organization`}
        />
      </div>
      {dateRange && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-sub">{dateRange}</span>
          <CopyButton value={dateRange} copyKey={`${card.id}-date`} />
        </div>
      )}
      {card.detail &&
        Object.entries(card.detail).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between text-sm text-ink-sub"
          >
            <span>
              {key}: {value}
            </span>
            <CopyButton value={value} copyKey={`${card.id}-detail-${key}`} />
          </div>
        ))}
    </div>
  );
}

type Props = { initialCards: CareerCard[] };

export function CardList({ initialCards }: Props) {
  if (initialCards.length === 0) {
    return (
      <p className="text-ink-sub text-sm">
        아직 저장된 카드가 없어요. 증명서를 업로드해서 첫 번째 카드를
        만들어보세요.
      </p>
    );
  }

  const grouped = initialCards.reduce<Record<string, CareerCard[]>>(
    (acc, card) => {
      const key = card.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(card);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(grouped).map(([category, cards]) => (
        <section key={category}>
          <h2 className="text-base font-semibold mb-3">
            {CATEGORY_LABELS[category as CareerCard["category"]] ?? category}
          </h2>
          <div className="flex flex-col gap-3">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

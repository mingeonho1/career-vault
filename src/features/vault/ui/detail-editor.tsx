"use client";

type Props = {
  detail: Record<string, string>;
  onChange: (detail: Record<string, string>) => void;
};

export function DetailEditor({ detail, onChange }: Props) {
  const entries = Object.entries(detail);

  function updateValue(key: string, value: string) {
    onChange({ ...detail, [key]: value });
  }

  function removeEntry(key: string) {
    const next = { ...detail };
    delete next[key];
    onChange(next);
  }

  function addEntry() {
    const newKey = `항목${entries.length + 1}`;
    onChange({ ...detail, [newKey]: "" });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">부가 정보</span>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-sm text-ink-sub w-24 shrink-0">{key}</span>
          <input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            className="flex-1 bg-surface border border-border rounded-xl h-10 px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => removeEntry(key)}
            className="text-xs text-danger shrink-0"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-sm text-primary text-left"
      >
        + 부가 정보 추가
      </button>
    </div>
  );
}

"use client";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function VaultError({ reset }: Props) {
  return (
    <div className="flex flex-col gap-4 items-start">
      <p className="text-danger text-sm">
        카드 목록을 불러오는 데 실패했어요. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-white font-semibold rounded-xl h-12 px-5"
      >
        다시 시도
      </button>
    </div>
  );
}

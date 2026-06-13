"use client";
import { useState } from "react";
import { recordFeatureInterest } from "@/features/vault/card-actions";

type PrecisionState = "idle" | "loading" | "done" | "error";

export function PrecisionAnalysisButton() {
  const [status, setStatus] = useState<PrecisionState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setStatus("loading");
    const result = await recordFeatureInterest("precision_extract");
    if (!result.ok) {
      setErrorMsg(result.error);
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm text-ink-sub">
        준비 중이에요. 관심 가져주셔서 감사해요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="bg-surface text-ink font-medium rounded-xl h-12 px-5 text-sm disabled:opacity-50"
      >
        {status === "loading"
          ? "기록 중..."
          : "문서가 흐릿하거나 오래돼 인식이 정확하지 않나요? 정밀 분석 (준비 중)"}
      </button>
      {status === "error" && <p className="text-danger text-sm">{errorMsg}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import {
  uploadFile,
  extractAndSaveDocument,
} from "@/features/vault/upload-actions";
import type { ExtractedCard } from "@/features/vault/schema";
import { ExtractReviewForm } from "@/features/vault/ui/extract-review-form";
import { ManualCardForm } from "@/features/vault/ui/manual-card-form";

type State =
  | { stage: "idle" }
  | { stage: "uploading" }
  | { stage: "extracting"; documentId: string }
  | { stage: "review"; documentId: string; cards: ExtractedCard[] }
  | { stage: "extract-failed"; documentId: string; message: string }
  | { stage: "error"; message: string };

export function UploadSection() {
  const [state, setState] = useState<State>({ stage: "idle" });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ stage: "uploading" });
    const formData = new FormData();
    formData.append("file", file);
    const uploadResult = await uploadFile(formData);

    if (!uploadResult.ok) {
      setState({ stage: "error", message: uploadResult.error });
      return;
    }

    setState({ stage: "extracting", documentId: uploadResult.documentId });
    const extractResult = await extractAndSaveDocument(uploadResult.documentId);
    if (!extractResult.ok) {
      setState({
        stage: "extract-failed",
        documentId: uploadResult.documentId,
        message: extractResult.error,
      });
      return;
    }
    setState({
      stage: "review",
      documentId: uploadResult.documentId,
      cards: extractResult.cards,
    });
  }

  if (state.stage === "uploading") {
    return <p className="text-ink-sub text-sm">업로드 중...</p>;
  }

  if (state.stage === "extracting") {
    return <p className="text-ink-sub text-sm">분석 중...</p>;
  }

  if (state.stage === "extract-failed") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-warning text-sm">
          {state.message} 직접 입력해서 저장할 수 있어요.
        </p>
        <ManualCardForm documentId={state.documentId} />
      </div>
    );
  }

  if (state.stage === "error") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-danger text-sm">{state.message}</p>
        <button
          type="button"
          onClick={() => setState({ stage: "idle" })}
          className="bg-primary text-white font-semibold rounded-xl h-12 px-5 w-fit"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (state.stage === "review") {
    return (
      <ExtractReviewForm cards={state.cards} documentId={state.documentId} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="bg-primary text-white font-semibold rounded-xl h-12 px-5 flex items-center justify-center cursor-pointer w-fit">
        증명서 업로드
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      <p className="text-xs text-ink-sub">PDF, PNG, JPG · 최대 10MB</p>
      <ManualCardForm />
    </div>
  );
}

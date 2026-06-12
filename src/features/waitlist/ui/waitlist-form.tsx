"use client";
import { useState } from "react";
import { joinWaitlist } from "../actions";

type State =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; alreadyExists?: boolean }
  | { type: "error"; message: string };

export function WaitlistForm() {
  const [state, setState] = useState<State>({ type: "idle" });

  async function submitEmail(formData: FormData) {
    setState({ type: "loading" });
    const result = await joinWaitlist(formData);
    if (!result.ok) {
      setState({ type: "error", message: result.error });
    } else {
      setState({ type: "success", alreadyExists: result.alreadyExists });
    }
  }

  if (state.type === "success") {
    return (
      <p className="text-sm text-ink">
        {state.alreadyExists
          ? "이미 등록되어 있어요."
          : "등록됐어요! 프리미엄 출시 시 안내해 드릴게요."}
      </p>
    );
  }

  return (
    <form action={submitEmail} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        placeholder="이메일 주소를 입력하세요"
        required
        className="w-full bg-surface border border-border rounded-xl h-12 px-4 text-sm text-ink placeholder:text-ink-weak focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {state.type === "error" && (
        <p className="text-danger text-sm">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={state.type === "loading"}
        className="h-12 bg-primary text-white font-semibold rounded-xl px-5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary-strong active:scale-[0.98]"
      >
        {state.type === "loading" ? "등록 중..." : "대기명단 등록하기"}
      </button>
    </form>
  );
}

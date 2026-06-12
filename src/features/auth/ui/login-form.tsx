"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/features/auth/actions";

type ActionState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string };

const initialState: ActionState = { status: "idle" };

function formAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return sendMagicLink(formData).then((result) => {
    if (result.ok) return { status: "sent" };
    return { status: "error", message: result.error };
  });
}

export function LoginForm() {
  const [state, dispatch, isPending] = useActionState(formAction, initialState);

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl bg-surface p-6 text-center">
        <p className="text-base font-semibold text-ink">
          이메일을 확인해주세요
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-sub">
          입력하신 주소로 로그인 링크를 보냈어요.
          <br />
          링크를 클릭하면 바로 입장됩니다.
        </p>
      </div>
    );
  }

  return (
    <form action={dispatch} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          required
          className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-ink placeholder:text-ink-weak focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {state.status === "error" && (
          <p className="text-sm text-danger">{state.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "보내는 중..." : "로그인 링크 받기"}
      </button>
    </form>
  );
}

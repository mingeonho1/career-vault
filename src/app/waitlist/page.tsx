import { WaitlistForm } from "@/features/waitlist/ui/waitlist-form";

export default function WaitlistPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
          프리미엄 대기명단
        </h1>
        <p className="text-sm text-ink-weak mb-8">
          대용량 보관·양식 자동완성 무제한 — 출시 알림을 먼저 받으세요.
        </p>
        <WaitlistForm />
      </div>
    </main>
  );
}

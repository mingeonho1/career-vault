import { Upload, Sparkles, Copy } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "증명서 업로드",
    description: "졸업증명서, 경력증명서, 자격증 등 파일을 올리세요.",
  },
  {
    icon: Sparkles,
    title: "AI 자동 추출",
    description: "AI가 기관명, 날짜, 자격 정보를 구조화해서 저장해요.",
  },
  {
    icon: Copy,
    title: "3초 복사",
    description: "지원서 항목에 맞는 정보를 클릭 한 번으로 복사하세요.",
  },
];

export default function LandingPage() {
  return (
    <main className="max-w-screen-sm mx-auto px-5 py-16 flex flex-col gap-16">
      <section className="flex flex-col gap-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink leading-tight">
          자소서 쓸 때마다 찾는 그 정보,
          <br />
          3초 안에 복사
        </h1>
        <p className="text-base text-ink-sub leading-relaxed">
          증명서를 한 번 올려두면 AI가 정보를 구조화해요.
          <br />
          학력, 자격증, 경력 — 지원서마다 다시 찾지 마세요.
        </p>
        <div className="flex justify-center">
          <a
            href="/login"
            className="h-12 bg-primary text-white font-semibold rounded-xl px-5 inline-flex items-center transition-colors hover:bg-primary-strong active:scale-[0.98]"
          >
            무료로 시작하기
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">이렇게 쓰세요</h2>
        <ul className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li
              key={i}
              className="bg-surface rounded-2xl p-5 flex gap-4 items-start"
            >
              <span className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon size={18} className="text-primary" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">
                  {step.title}
                </span>
                <span className="text-sm text-ink-sub leading-relaxed">
                  {step.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="text-center">
        <p className="text-sm text-ink-weak mb-2">
          대용량 보관·양식 자동완성 무제한 — 프리미엄 출시 예정
        </p>
        <a href="/waitlist" className="text-primary text-sm underline">
          프리미엄 대기명단 등록하기
        </a>
      </section>
    </main>
  );
}

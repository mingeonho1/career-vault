export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        이번 주의 제품이
        <br />
        여기 들어옵니다
      </h1>
      <p className="text-lg leading-relaxed text-ink-sub">
        PLAN.md가 정의하는 단 하나의 핵심 기능.
        <br />
        디자인 규칙은 design 스킬을 따릅니다.
      </p>
      <button
        type="button"
        className="h-12 rounded-xl bg-primary px-5 font-semibold text-white transition-colors hover:bg-primary-strong active:scale-[0.98]"
      >
        빌드 시작하기
      </button>
      <p className="text-sm text-ink-weak">
        이 화면은 템플릿 플레이스홀더입니다 — 첫 태스크에서 교체하세요.
      </p>
    </main>
  );
}

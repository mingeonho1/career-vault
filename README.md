# MVP Factory

매주말 MVP 하나를 기획 → 구현 → 검수 → 배포하는 에이전트 하네스 템플릿.
새 빌드는 이 리포를 **Use this template**으로 복제해서 시작한다.

## 철학

- **에이전트 분리**: 기획(lead) / 구현(builder) / 검수(reviewer)를 별도 서브에이전트로 분리. 기획한 에이전트가 자기 결과물을 검수하면 같은 맹점을 두 번 통과하므로, 검수는 깨끗한 컨텍스트가 맡는다.
- **규칙은 훅으로 강제**: 프롬프트는 해석에 의존하지만 훅은 결정론적이다. 포맷팅, 위험 명령 차단, 품질 게이트는 전부 훅이 처리한다.
- **컨텍스트 경제**: CLAUDE.md는 철칙과 포인터만. 상세 규칙은 스킬로 분리해 관련 작업 때만 조건부 로딩. 무거운 구현 로그는 서브에이전트의 격리 컨텍스트에서 소각.

## 5분 시작

```bash
pnpm install
claude   # Claude Code 실행
```

첫 프롬프트: `lead로 이번 주 빌드 PLAN.md 만들어줘. 아이디어: <한 줄>`

## 구조

| 경로 | 역할 |
|---|---|
| `CLAUDE.md` | 철칙 5개 + 포인터 (항상 로딩) |
| `PLAN.md` | 이번 빌드의 범위 정의 (lead가 생성) |
| `BUILD_LOG.md` | 의사결정/삽질 로그 — 블로그 글의 원재료 |
| `.claude/agents/` | lead(기획) · builder(구현) · reviewer(검수) |
| `.claude/skills/` | architecture · conventions · shipping · log-decision · write-post · blog-style |
| `.claude/hooks/` | guard(위험 명령 차단) · format(자동 포맷) · verify(종료 전 품질 게이트) |

## 주말 운영 타임라인

| 시간 | 작업 |
|---|---|
| 금 저녁 | 아이디어 확정 → lead가 PLAN.md 생성 → Non-goals 승인 |
| 토 | builder 구현 (태스크당 `pnpm check` 통과 필수) → reviewer 1차 검수 |
| 일 오전 | reviewer `SHIP IT` → shipping 스킬 절차로 Vercel 배포 + 계측 |
| 일 오후 | write-post 스킬로 블로그 글 → 발행 → 아래 표 갱신 |

**킬 규칙**: 배포 2주 내 결제/사용 신호 0이면 유지보수 중단 (리포는 공개 유지).

## 품질 게이트 (3중)

1. 스킬 — 에이전트가 컨벤션/아키텍처 규칙 참조
2. 훅 — Stop 시 `pnpm check` 실패하면 세션 종료 자체가 차단됨
3. CI — push마다 lint + typecheck + test + build + knip

## 빌드 결과

| 주차 | 제품 | 링크 | 검증 지표 | 결과 |
|---|---|---|---|---|
| — | — | — | — | — |

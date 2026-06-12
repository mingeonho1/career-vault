---
name: design
description: UI/화면을 만들거나 수정할 때 반드시 따르는 디자인 시스템. 컬러 토큰, 타이포그래피, 컴포넌트 규칙, 레이아웃, 카피 작성 규칙 포함. 토스(Toss) 스타일 기반.
---

# 디자인 시스템 — 토스 스타일

철학: **한 화면, 한 메시지.** 위계는 장식이 아니라 크기·굵기·여백으로 만든다. 사용자가 0.5초 안에 "여기서 뭘 하면 되는지" 알 수 있어야 한다.

## 컬러 토큰 (globals.css의 @theme에 정의됨 — 임의 색상 추가 금지)

| 토큰 | 값 | 용도 |
|---|---|---|
| `bg` | #FFFFFF | 페이지 배경 |
| `surface` | #F9FAFB | 카드, 입력 영역 배경 |
| `border` | #E5E8EB | 구분선, 입력 테두리 |
| `ink` | #191F28 | 제목, 본문 강조 |
| `ink-sub` | #4E5968 | 본문 |
| `ink-weak` | #8B95A1 | 캡션, 보조 정보, 면책 문구 |
| `primary` | #3182F6 | CTA, 링크, 포커스 — **화면당 파란 요소는 1~2개** |
| `primary-strong` | #1B64DA | primary hover/press |
| `danger` | #F04452 | 에러, 파괴적 액션 |

사용: `bg-bg`, `bg-surface`, `border-border`, `text-ink`, `text-ink-sub`, `text-ink-weak`, `bg-primary`, `text-primary`.

## 타이포그래피

- 폰트는 Pretendard 하나만 쓴다 (globals.css에 로딩됨). 개성은 폰트 종류가 아니라 크기·굵기 대비에서 나온다.
- 스케일: 히어로 `text-4xl~5xl font-bold` / 섹션 제목 `text-2xl font-bold` / 본문 `text-base text-ink-sub` / 캡션 `text-sm text-ink-weak`
- 큰 제목에는 `tracking-tight` 필수 (한글은 자간을 조이면 단단해진다). 본문 행간 `leading-relaxed`.
- 숫자가 주인공인 화면(계산 결과 등)은 숫자를 가장 크게: `text-4xl font-bold text-ink` + 단위는 `text-lg text-ink-sub`.

## 컴포넌트 규칙

- **버튼**: primary는 `bg-primary text-white font-semibold rounded-xl h-12 px-5`, hover `bg-primary-strong`, press `scale-[0.98]`. 라벨은 동사형 — "제출"이 아니라 "기한 계산하기". 한 화면에 primary 버튼 1개.
- **보조 버튼**: `bg-surface text-ink font-medium rounded-xl` — 테두리 없이 면으로.
- **입력**: `bg-surface border border-border rounded-xl h-12 px-4`, focus `border-primary ring-2 ring-primary/20`. 라벨은 입력 위에 `text-sm font-medium text-ink`. placeholder는 예시값 ("2026-06-12").
- **카드**: `bg-surface rounded-2xl p-5~6`. 테두리와 그림자를 동시에 쓰지 않는다 — 면(surface)으로 구분하는 게 기본, 그림자는 띄워야 할 때만 `shadow-sm`.
- **상태 4종 의무**: 모든 데이터 화면은 빈/로딩/에러/결과 상태를 가진다. 에러는 원인+복구 행동 ("날짜 형식을 확인해주세요"), 빈 화면은 행동 유도 문구.

## 레이아웃

- 모바일 우선. 콘텐츠는 `max-w-screen-sm mx-auto px-5` 단일 컬럼이 기본 — 도구형 MVP에 2컬럼이 필요한 경우는 드물다.
- 여백이 디자인이다: 섹션 사이 `py-16~24`, 연관 요소 `gap-3~4`, 다른 맥락 `gap-8+`. 비좁으면 요소를 줄인다 (여백을 줄이지 말 것).
- 히어로 = 제품의 한 문장: 큰 헤드라인(무엇을 해주는가) + 보조 한 줄(누구의 어떤 문제) + primary CTA 1개. 배지·통계·그라데이션 장식으로 채우지 않는다.

## 모션

- 150~200ms `ease-out`, hover/press/등장에만. 스크롤 트리거·패럴랙스 금지 (주말 MVP에서 모션은 신뢰감용 미세 피드백이면 충분하다).
- `transition-colors`, `transition-transform`만 기본 허용.

## 카피 (토스식)

- 쉬운 한국어, 해요체. "유효하지 않은 입력입니다" ➜ "날짜를 다시 확인해주세요".
- 버튼은 누르면 일어나는 일을 그대로: "확인" 금지, "기한 저장하기" 형태.
- 숫자는 구체적으로, 단위와 함께. 과장 형용사 금지.
- 면책/법적 문구는 `text-sm text-ink-weak`로 본문과 분리하되 숨기지 않는다.

## 금지 목록

- 화면당 3색 초과 (ink 계열 + primary + 필요시 danger가 전부)
- 그라데이션 배경, 글래스모피즘, 이모지를 아이콘 대용으로 사용 (아이콘은 lucide-react)
- 테두리+그림자 동시 사용, radius 혼용 (컨트롤 `rounded-xl`, 카드 `rounded-2xl`로 통일)
- 다크모드 (MVP 범위 밖 — Non-goals)
- 중앙 정렬 본문 단락 (제목·히어로만 중앙 허용, 본문은 좌측 정렬)

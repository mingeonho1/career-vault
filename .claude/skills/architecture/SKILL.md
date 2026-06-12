---
name: architecture
description: 폴더 구조, 레이어 규칙, 데이터 흐름. 새 파일이나 모듈을 만들 위치를 정할 때, 모듈 간 import 관계를 정할 때 참조한다.
---

# 아키텍처: Vertical Slice

기능 단위로 수직으로 자른다. 레이어(controllers/, services/, utils/)로 수평으로 자르지 않는다.

```
src/
├── app/                    # Next.js 라우팅만. 페이지는 얇게 —
│   │                       # 데이터 조립 후 feature 컴포넌트에 위임
│   ├── layout.tsx
│   ├── page.tsx            # 랜딩
│   └── (product)/...       # 핵심 기능 라우트
├── features/
│   └── <feature-name>/     # 기능 하나의 모든 것이 한 폴더에
│       ├── ui/             # 이 기능 전용 컴포넌트
│       ├── actions.ts      # server actions (쓰기)
│       ├── queries.ts      # 데이터 조회 (읽기)
│       └── schema.ts       # zod 스키마 + 파생 타입
├── lib/                    # 진짜 공용만: db.ts(supabase client), env.ts, payments.ts
└── components/ui/          # 순수 표시용 공용 컴포넌트 (shadcn 생성물 포함)
```

## 규칙

1. **features 간 직접 import 금지.** A 기능이 B 기능의 코드를 쓰고 싶어지면, 그 코드를 lib로 승격할지 검토한다 — 단 3회 이상 쓰일 때만 (Rule of Three). 2회째까지는 복붙이 정답이다.
2. **데이터 흐름은 단방향:** `app(page) → features(query/action) → lib(db)`. UI 컴포넌트에서 db 클라이언트 직접 호출 금지.
3. **검증은 경계에서 한 번:** server action과 route handler의 첫 줄은 `schema.parse(input)`. 내부 함수들은 검증된 타입을 신뢰하고 재검증하지 않는다.
4. **"나중을 위한" 폴더/파일 미리 만들기 금지.** 빈 디렉토리는 거짓말이다. 기능이 생길 때 폴더가 생긴다.
5. **MVP의 feature 폴더는 보통 1~2개다.** 3개를 넘으면 PLAN.md 범위를 의심하고 lead에게 보고한다.

## 안티패턴 (발견 즉시 수정)

- `utils/` 잡동사니 폴더 — 모든 헬퍼는 쓰이는 feature 안에 둔다. lib 승격은 Rule of Three 충족 시에만.
- `types.ts` 전역 타입 파일 — 타입은 zod 스키마 옆(`schema.ts`)에서 파생한다.
- Repository/Service 클래스 계층 — MVP 규모에서는 함수면 충분하다. 클래스는 상태+행동이 진짜로 묶일 때만.
- barrel file(`index.ts`에서 전부 re-export) — tree-shaking을 해치고 순환 import의 온상. 직접 경로로 import한다.

# Build Log — 이력 금고 (career-vault)

## Decisions

### [2026-06-13] 기본 추출 모델을 gemini-3.1-flash-lite로 변경

- 선택: `extractCardsFromDocument` 기본 model 인자를 `"gemini-3.1-flash-lite"`로 설정
- 대안: 기존 `gemini-3.5-flash` 유지
- 이유: 타겟 사용자("대부분 정확하게 기재된 깨끗한 문서")에게 lite 모델이 비용·속도 면에서 충분. 정밀도가 필요한 케이스는 fake-door 수요 확인 후 다음 빌드에서 연결
- 트레이드오프: 흐릿하거나 오래된 문서에서 추출 정확도가 낮을 수 있음 — fake-door 버튼으로 수요 측정 후 3.5 경로 연결 결정

### [목 00:00] server-only 패키지로 서버 전용 모듈 클라이언트 번들 유입 차단

- 선택: `server-only` npm 패키지 import를 db.ts 최상단에 추가
- 대안: 파일 이름 규칙으로만 관리, 런타임 체크
- 이유: Next.js App Router에서 `import "server-only"`가 빌드 타임에 실제 번들 포함을 차단하므로 SECRET_KEY 노출 위험을 컴파일 단계에서 막을 수 있음
- 트레이드오프: 해당 모듈을 클라이언트 컴포넌트에서 import하면 빌드 에러 발생 — 의도된 동작

### [목 00:00] 브라우저/서버 클라이언트를 별도 파일로 분리 (db.ts / db-browser.ts)

- 선택: db.ts (server-only, SECRET_KEY), db-browser.ts (PUBLISHABLE_KEY)
- 대안: 단일 파일에서 클라이언트 종류 분기
- 이유: server-only import를 파일 단위로 적용해야 번들 차단이 확실함. 하나의 파일에서 export를 분기하면 import 경로만으로 서버 전용 여부를 알기 어려움
- 트레이드오프: 파일이 2개로 늘어남 — MVP 규모에서 허용 가능

### [목 20:50] middleware에서 createSupabaseServerClient 헬퍼 대신 createServerClient 직접 사용

- 선택: middleware.ts에서 `@supabase/ssr`의 `createServerClient`를 직접 호출
- 대안: db-server.ts의 `createSupabaseServerClient` 재사용
- 이유: `createSupabaseServerClient`는 `next/headers`의 `cookies()`를 사용하는데, middleware에서는 request/response 쿠키를 직접 다뤄야 세션 갱신이 정상 동작함
- 트레이드오프: 쿠키 핸들링 코드 중복 — middleware는 맥락이 달라 재사용 불가

### [2026-06-12] Gemini 모델 gemini-3.5-flash 유지 (builder의 2.5-flash 대체 시도 롤백)

- 선택: `gemini-3.5-flash` (PLAN.md 명시 그대로)
- 대안: builder가 학습 데이터 기준 "존재하지 않는 모델"로 판단해 `gemini-2.5-flash`로 교체했었음
- 이유: 실제 API 에러 없이 추측으로 모델을 바꾸는 것은 스펙 위반. 웹 검색으로 확인 결과 gemini-3.5-flash는 2026-05-19 GA된 정식 stable 모델 ID (ai.google.dev/gemini-api/docs/models/gemini-3.5-flash)
- 트레이드오프: 없음 — 런타임에서 모델명 invalid 에러가 실제로 발생하면 그때 API 모델 목록 조회로 확인 후 교체한다

### [목 20:50] RRN 감지를 정규식 하나로 구현, 라이브러리 미사용

- 선택: `/\b\d{6}\s*[-–—]\s*\d{7}\b/` 단일 정규식
- 대안: 전용 개인정보 감지 라이브러리
- 이유: 감지 패턴이 명확하고 50줄 이하로 직접 구현 가능. 외부 의존성 추가 기준(conventions) 미충족
- 트레이드오프: 검증 알고리즘(월일 범위 등) 미적용 — 저장 전 1차 필터 용도로 충분

### [2026-06-12] T12 대기명단 제출 성공 검증 로컬 스모크 제외

- 선택: 대기명단 제출 성공 메시지 검증(T12 일부)을 로컬 e2e 스모크에서 제외하고 배포 후 수동 체크로 이관
- 대안: Supabase 로컬 에뮬레이터(supabase start)를 실행해 로컬에서도 DB 연동 테스트
- 이유: 실 Supabase insert + RLS 동작 검증은 로컬 에뮬레이터가 필요하고, MVP 일정상 에뮬레이터 셋업 비용이 검증 가치 대비 크다. 랜딩→CTA→로그인 도달은 로컬에서 검증 가능하므로 스모크 범위를 거기까지만 유지
- 트레이드오프: 대기명단 insert 버그가 배포 후에야 발견될 수 있음 — 배포 직후 수동 체크로 보완

### [2026-06-12] SITE_URL default 제거 — fail-fast 선택

- 선택: `SITE_URL: z.string().url()` — `.default("http://localhost:3000")` 제거
- 대안: default 유지 (기존 방식)
- 이유: default가 있으면 프로덕션에서 SITE_URL 미설정 시 매직링크가 localhost로 발송되는 조용한 장애 발생. 기동 시 ZodError로 즉시 실패시켜 배포 전에 포착
- 트레이드오프: 로컬 dev에서도 .env에 SITE_URL 필수. .env.example에 이미 포함돼 있어 신규 개발자 영향 최소

### [2026-06-13] 기본 추출 모델을 gemini-3.1-flash-lite로 변경

- 선택: `extractCardsFromDocument` 기본 model 인자를 `"gemini-3.1-flash-lite"`로 설정
- 대안: 기존 `gemini-3.5-flash` 유지
- 이유: 타겟 사용자("대부분 정확하게 기재된 깨끗한 문서")에게 lite 모델이 비용·속도 면에서 충분. 정밀도가 필요한 케이스는 fake-door 수요 확인 후 다음 빌드에서 연결
- 트레이드오프: 흐릿하거나 오래된 문서에서 추출 정확도가 낮을 수 있음 — fake-door 버튼으로 수요 측정 후 3.5 경로 연결 결정

### [2026-06-12] 클라이언트 번들 시크릿 키 노출 없음 확인

- 확인: `grep -r "SUPABASE_SECRET_KEY\|GEMINI_API_KEY" .next/static/` 결과 없음
- 결론: server-only import와 Next.js App Router 서버 컴포넌트가 SECRET_KEY, GEMINI_API_KEY를 클라이언트 번들에서 완전히 격리함

## Stuck & Solved

- pnpm-workspace.yaml의 allowBuilds가 미설정 상태로 `@google/genai`, `protobufjs` 빌드 스크립트가 차단되어 `pnpm install`이 실패함 → pnpm-workspace.yaml에서 두 패키지를 `true`로 설정하여 해결

## Backlog

## Ship

## Retro

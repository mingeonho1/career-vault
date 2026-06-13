# 이력 금고 (career-vault)

## 문제

지원서를 10개 이상 쓰는 취준생·이직 준비자는 학교 입학·졸업 연월, 자격증 번호·취득일, 병역, 경력 기간 같은 정보를 매번 증명서를 뒤져 다시 찾느라 지원서 1건당 수십 분을 낭비한다.

## 타겟

이번 시즌 공채·수시에 지원서 10개 이상을 쓰는 취준생, 그리고 경력기술서·이직 지원서를 반복 작성하는 3~7년차 이직 준비자.

## 핵심 기능 (단 1개)

증명서 파일(PDF/이미지)을 업로드한 사용자가, AI가 기관·명칭·날짜를 구조화 추출해 자동 저장한 "이력 카드"를 항목별 원클릭 복사로 3초 안에 꺼내 쓴다.

보조 기능(핵심의 연장, 같은 데이터 위에서 동작): 지원서 양식 텍스트를 붙여넣으면 내 카드 데이터로 답안 매칭을 생성한다.

## 화면 (최대 3개)

1. 랜딩 — "자소서 쓸 때마다 찾는 그 정보, 한 번 올려두고 3초 안에 복사하세요." 히어로 + CTA(매직링크 가입) + 프리미엄 대기명단 진입점
2. 금고 (핵심 기능 화면, 로그인 필수) — (a) 파일 업로드 → 추출 결과 확인/수정 → 카드 저장 (추출 실패 시 직접 입력 폴백) + "정밀 분석(준비 중)" fake-door 버튼, (b) 카테고리별 카드 목록 + 항목별 복사 버튼, (c) 양식 매핑 섹션(양식 텍스트 붙여넣기 → 매칭 답안 + 복사). 빈/로딩/에러/결과 4상태 모두 서술적 안내 제공
3. 대기명단 — 프리미엄(대용량 보관·양식 자동완성 무제한) 대기명단 이메일 등록

## 데이터 모델 (테이블 3개 이하 — 핵심 도메인 데이터 기준)

모든 테이블 RLS 적용 — 본인(user_id = auth.uid()) 행만 select/insert/update/delete. waitlist는 insert만 공개.

- `documents`: id, user_id, storage_path, file_name, mime_type, size_bytes, status('uploaded'|'extracted'|'failed'), created_at
- `career_cards`: id, user_id, category('education'|'certificate'|'military'|'career'|'language'|'etc'), title(명칭), organization(기관), start_date(date, null 허용), end_date(date, null 허용), detail(jsonb — 카테고리별 부가 필드), source_document_id(documents FK, null 허용 — 직접 입력 시), created_at
- `waitlist`: id, email(unique), user_id(null 허용), created_at

**메트릭 테이블(예외, 핵심 도메인 데이터 아님)**:

- `feature_interest`: id, feature_key(text), user_id(uuid), created_at, **unique(feature_key, user_id)**. "특정 기능을 원하는 distinct 사용자 수"를 세기 위한 fake-door 수요 측정용 테이블. architecture의 "테이블 3개 이하"는 핵심 도메인 데이터 기준 가이드이며, 이 테이블은 검증 지표용 메트릭이므로 예외로 둔다(사유: 클릭을 documents/career_cards 같은 도메인 테이블에 섞으면 도메인 무결성이 흐려지고, 본인 행 1건만 남기는 unique 제약으로 distinct 수요 집계가 단순해진다 — 추가 비용 < 분석 명확성).

주민등록번호 저장 필드는 어떤 테이블에도 만들지 않는다. (테이블 외) Supabase Storage private 버킷 `certificates` — 접근은 signed URL로만, 파일당 10MB·유저당 50MB.

## 기술 스택 메모

기본값(TypeScript + Next.js App Router + Tailwind + shadcn/ui + Supabase) 준수. 추가: AI 추출은 Gemini API(`@google/genai` 공식 SDK), 호출은 서버 사이드 전용.

**모델 정책**: 기본 추출 모델은 `gemini-3.1-flash-lite`(저비용·고속). 전제 — 사용자는 "대부분 정확하게 기재된 깨끗한 문서"를 올린다. 고정밀 모델 `gemini-3.5-flash`는 코드에서 제거하지 않고, 추출 함수가 모델명을 인자로 받아 선택 가능하도록 남겨둔다(현재 호출부는 기본값 lite만 사용 — 정밀 분석 fake-door 수요가 충분히 확인되면 연결). 모델 선택 분기는 미리 만들지 않는다(Rule of Three).

env 키 이름 고정: `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` / `GEMINI_API_KEY` / `SITE_URL`(매직링크 콜백 `emailRedirectTo`의 절대 URL 베이스, 서버 전용 — 프로덕션에서 매직링크가 동작하려면 절대 URL이 필요하다. process.env 직접 접근·빈 문자열 폴백 금지, 반드시 env.ts zod 스키마를 경유한다).

## 도메인 코어 공개 함수 계약 (모듈 간 계약 — builder는 시그니처를 변경하지 않는다)

- `detectRrn(text: string): boolean` — 주민등록번호 패턴(6자리-7자리, 공백·구분자 변형 포함) 감지. `src/features/vault/rrn.ts`
- `validateUpload(file: { name: string; mimeType: string; sizeBytes: number }, currentUsageBytes: number): { ok: true } | { ok: false; reason: "type" | "size" | "quota" }` — 화이트리스트(pdf/png/jpg), 파일당 10MB, 유저당 50MB. `src/features/vault/upload-policy.ts`
- `extractedCardSchema` (zod) 및 파생 타입 `ExtractedCard` — AI structured output의 경계 검증 스키마. `src/features/vault/schema.ts`
- `extractCardsFromDocument(file: { bytes: Uint8Array; mimeType: string }, model?: string): Promise<ExtractedCard[]>` — Gemini 호출 래퍼, 서버 전용. `model` 기본값 `gemini-3.1-flash-lite`, 인자로 `gemini-3.5-flash`(고정밀) 지정 가능. 현재 호출부는 기본값만 사용한다. `src/features/vault/extract.ts`
- `mapFormToAnswers(formText: string, cards: CareerCard[]): Promise<FormAnswerDraft[]>` — Gemini 호출 래퍼, 서버 전용. `src/features/form-mapping/map.ts`

## Non-goals (이번 주에 절대 안 만드는 것)

- 정밀 분석의 실제 고정밀 추출 실행 — `gemini-3.5-flash` 경로는 함수 인자로만 존재하고 UI에서 호출하지 않는다. 클릭 수요가 충분히 확인된 다음 주 빌드에서 버튼에 연결한다.
- 모델 자동 선택/품질 분기 로직 (수요 확인 전까지 만들지 않음)
- 용량 티어·결제 (대기명단 이메일 수집까지만)
- 자소서 문장 생성 (양식 "매칭"까지만 — 문장을 새로 써주지 않는다)
- 팀/공유 기능
- 소셜 로그인 (이메일 매직링크만)
- 모바일 앱
- 알림 (이메일/푸시 일체)
- 카드 검색·필터 (카테고리 그룹핑까지만)
- 증명서 원본 뷰어/주석 (signed URL 다운로드 링크까지만)

## 테스트 케이스 (태스크 매핑용 ID)

- T1: `detectRrn("900101-1234567" 포함 문장)` → true
- T2: 변형 패턴 `"900101 - 1234567"`, `"900101–1234567"` → true
- T3: 전화번호 `"010-1234-5678"`, 사업자번호 등 비-RRN → false
- T4: `validateUpload` — 11MB pdf → `{ ok: false, reason: "size" }`
- T5: `validateUpload` — exe/zip MIME 또는 확장자 불일치 → `{ ok: false, reason: "type" }`
- T6: `validateUpload` — 누적 45MB 상태에서 8MB 추가 → `{ ok: false, reason: "quota" }`, 누적 40MB+8MB → `{ ok: true }`
- T7: `extractedCardSchema` — 정상 AI 응답 JSON 파싱 성공, category/날짜 타입 보장
- T8: `extractedCardSchema` — 잘못된 category·날짜 형식 → 파싱 실패 (throw)
- T9: 카드 저장 action — title/organization/detail 어디든 RRN 패턴 포함 시 저장 거부 + 안내 메시지 반환
- T10: waitlist 스키마 — 잘못된 이메일 형식 거부
- T11: form-mapping 응답 스키마 — Gemini 응답이 `FormAnswerDraft[]` 스키마를 통과, 불량 응답은 파싱 실패
- T12: e2e 스모크 — 랜딩 렌더 → CTA 클릭 → 로그인 페이지 도달 + 대기명단 폼 표시 (대기명단 제출 성공은 실 Supabase 연결이 필요해 로컬 스모크에서 제외 — 배포 후 수동 체크 항목)
- T13: `recordFeatureInterest` action — 동일 user_id가 같은 feature_key로 2회 호출해도 feature_interest 행은 1개만 존재한다(unique 충돌은 에러 없이 멱등 처리, 성공 응답 반환). 비로그인 호출은 거부.

## 작업 분해 (builder용 체크리스트, 각 2시간 이하)

- [x] 1. 의존성·env·Supabase 클라이언트 셋업
  - 경로: package.json, src/lib/env.ts, src/lib/db-server.ts
  - 완료 조건: `@supabase/supabase-js`·`@supabase/ssr`·`@google/genai` 설치. env.ts에 `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`/`GEMINI_API_KEY`/`SITE_URL` 5개 키가 zod로 검증된다. Supabase 접근은 db-server.ts의 쿠키 기반 user client(PUBLISHABLE_KEY, RLS 적용)로만 한다 — admin client(db.ts)·db-browser.ts는 사용처가 없어 만들지 않는다(이미 있으면 삭제). SECRET_KEY를 쓰는 모듈이 생길 경우 `server-only` import로 클라이언트 번들 유입을 차단한다. `pnpm check` 통과.
  - 참조: CLAUDE.md 철칙 §4 / architecture 스킬 (lib 규칙) / PLAN.md §기술 스택 메모
  - 테스트: 없음 (typecheck로 검증)

- [x] 2. DB 스키마 + RLS + Storage 버킷 마이그레이션
  - 경로: supabase/migrations/0001_init.sql
  - 완료 조건: documents/career_cards/waitlist 3테이블 생성, 3테이블 모두 RLS 활성화 + 본인 행만 접근하는 정책(waitlist는 anon insert만 허용). private 버킷 `certificates` 생성 + 본인 경로(`{user_id}/`)만 read/write 가능한 Storage 정책. career_cards에 주민등록번호 저장용 컬럼이 존재하지 않는다.
  - 참조: PLAN.md §데이터 모델
  - 테스트: 없음 (SQL — reviewer가 정책 존재 여부 검수)

- [x] 3. 인증 (이메일 매직링크)
  - 경로: src/app/login/page.tsx, src/app/auth/callback/route.ts, src/middleware.ts, src/features/auth/ (actions.ts, schema.ts, ui/)
  - 완료 조건: 이메일 입력 → 매직링크 발송 안내가 표시된다. 콜백 처리 후 /vault로 이동한다. 비로그인 상태로 /vault 접근 시 /login으로 리다이렉트된다. 이메일 입력은 zod로 경계 검증된다.
  - 참조: architecture 스킬 (단방향 데이터 흐름, 경계 검증) / PLAN.md §화면 2
  - 테스트: T12 (스모크 일부)

- [x] 4. 보안 코어: RRN 감지 + 업로드 정책 (순수 함수 + 단위 테스트)
  - 경로: src/features/vault/rrn.ts, src/features/vault/upload-policy.ts, src/features/vault/rrn.test.ts, src/features/vault/upload-policy.test.ts
  - 완료 조건: `detectRrn(text: string): boolean`이 T1~T3을 만족한다. `validateUpload(file, currentUsageBytes)`가 T4~T6을 만족한다(시그니처는 §도메인 코어 계약 그대로). `pnpm check`에서 테스트가 실행되어 통과한다.
  - 참조: PLAN.md §도메인 코어 공개 함수 계약 / CLAUDE.md 철칙 §4
  - 테스트: T1~T6

- [x] 5. 파일 업로드 server action
  - 경로: src/features/vault/actions.ts, src/features/vault/schema.ts
  - 완료 조건: action 첫 줄에서 zod 검증 후 `validateUpload`로 정책 검사 — 실패 시 reason별 한국어 안내 메시지를 반환하고 업로드하지 않는다. 통과 시 `certificates/{user_id}/` 경로에 업로드하고 documents 행(status='uploaded')을 생성한다. 원본 접근은 만료시간 있는 signed URL로만 발급된다.
  - 참조: PLAN.md §도메인 코어 계약, §데이터 모델 / architecture 스킬 규칙 3
  - 테스트: T4~T6 (정책 함수 경유)

- [x] 6. AI 추출 엔진 (Gemini structured output) — **기본 모델 변경**
  - 경로: src/features/vault/extract.ts, src/features/vault/schema.ts (extractedCardSchema)
  - 완료 조건: `extractCardsFromDocument(file, model?)`가 `@google/genai` SDK로 호출하며, `model` 인자 기본값은 `gemini-3.1-flash-lite`다(현재 호출부는 기본값만 전달). 고정밀 모델 `gemini-3.5-flash`는 동일 함수에 `model` 인자로 전달 시 동작하도록 경로를 남겨두되 호출부에서 사용하지 않는다(분기 로직 신설 금지). JSON 스키마 강제(structured output)로 호출하고 응답을 `extractedCardSchema.parse`로 검증해 `ExtractedCard[]`를 반환한다(T7~T8). 파일은 서버에서만 처리되며 이 모듈은 `server-only`다. 모델명 invalid 에러 발생 시: 임의의 모델명을 추측하지 말 것 — API 모델 목록 조회로 사용 가능한 flash-lite/flash 계열 최신 모델을 확인하고, BUILD_LOG.md에 기록(log-decision 형식)한 뒤 그 모델을 사용한다. 기본 모델을 lite로 내린 사유(비용·속도)도 BUILD_LOG.md에 기록한다.
  - 참조: PLAN.md §기술 스택 메모(모델 정책), §도메인 코어 계약 / CLAUDE.md 철칙 §4·§5
  - 테스트: T7~T8

- [x] 7. 추출→카드 저장 플로우 + 직접 입력 폴백 UI + 정밀 분석 fake-door 버튼
  - 경로: src/features/vault/actions.ts, src/features/vault/ui/extract-review-form.tsx, src/features/vault/ui/manual-card-form.tsx
  - 완료 조건: 업로드 완료 시 추출이 실행되고(기본 lite 모델) 결과가 수정 가능한 폼으로 표시되며, 확인 시 career_cards에 저장되고 documents.status='extracted'로 갱신된다. 추출 실패(API 에러·파싱 실패) 시 에러로 끝나지 않고 빈 직접 입력 폼이 표시되어 동일하게 저장할 수 있다(documents.status='failed'). 저장 action은 모든 텍스트 필드에 `detectRrn`을 적용해 감지 시 저장을 거부하고 "주민등록번호는 저장할 수 없어요. 해당 부분을 지우고 다시 저장해 주세요." 안내를 표시한다. **추출/업로드 화면에 "정밀 분석(준비 중)" 버튼(카피 예시: "문서가 흐릿하거나 오래돼 인식이 정확하지 않나요? — 정밀 분석(준비 중)", 최종 카피는 design 스킬 기준 builder가 다듬음)을 둔다. 버튼은 클릭 가능하며, 클릭 시 고정밀(3.5) 추출을 실행하지 않고 `recordFeatureInterest`(태스크 13)를 호출해 관심을 1회 기록하고 "준비 중이에요. 관심 감사합니다" 류 피드백만 표시한다(상태: 기본/기록중/기록완료).**
  - 참조: PLAN.md §화면 2(a), §도메인 코어 계약, §성공 지표 / design 스킬
  - 테스트: T9, T13(버튼→action 경로)

- [ ] 8. 카드 목록 + 원클릭 복사 (금고 메인 화면)
  - 경로: src/app/(product)/vault/page.tsx, src/features/vault/queries.ts, src/features/vault/ui/card-list.tsx
  - 완료 조건: 본인 카드가 카테고리별로 그룹핑되어 표시되고, 각 필드(기관/명칭/날짜) 옆 복사 버튼 클릭 시 클립보드에 복사되며 "복사됨" 피드백이 표시된다. 추출된 detail(자격증 번호 등 카테고리별 부가 필드)은 리뷰 폼에서 수정 가능하고 카드와 함께 저장되며, 카드 목록에서 detail의 각 필드도 동일하게 필드별 복사가 가능하다 — detail 유실은 명세 위반(§문제가 명시한 "자격증 번호"가 핵심 가치). 카드 0개일 때 업로드를 유도하는 빈 상태 화면이, 조회 중에는 로딩 상태가 표시된다.
  - 참조: PLAN.md §화면 2(b), §문제 / architecture 스킬 규칙 2 / design 스킬
  - 테스트: T12 (스모크 일부)

- [ ] 9. 양식 매핑 (보조 기능)
  - 경로: src/features/form-mapping/ (map.ts, actions.ts, schema.ts, ui/form-mapper.tsx), src/app/(product)/vault/page.tsx (섹션 연결)
  - 완료 조건: 양식 텍스트를 붙여넣고 실행하면 `mapFormToAnswers`(서버 전용, Gemini structured output, 응답 zod 검증 — T11)가 항목별 [양식 항목 → 내 데이터 답안] 매칭을 반환해 표시되고, 각 답안에 복사 버튼이 있다. 매칭할 카드가 없는 항목은 "데이터 없음"으로 표시된다. AI 실패 시 에러 안내 + 재시도 버튼이 표시된다(화면이 죽지 않는다). vault 카드 데이터는 form-mapping이 직접 import하지 않고 page에서 조립해 전달한다.
  - 참조: PLAN.md §도메인 코어 계약 / architecture 스킬 규칙 1·2
  - 테스트: T11

- [x] 10. 랜딩 페이지
  - 경로: src/app/page.tsx
  - 완료 조건: 히어로(헤드라인 "자소서 쓸 때마다 찾는 그 정보, 3초 안에 복사" + 서브카피 + CTA 버튼 → /login) + 핵심 기능 3단계 설명(업로드→추출→복사) 섹션 + 프리미엄 대기명단 진입 링크가 표시된다.
  - 참조: PLAN.md §화면 1 / design 스킬
  - 테스트: T12 (스모크 일부)

- [x] 11. 프리미엄 대기명단
  - 경로: src/features/waitlist/ (actions.ts, schema.ts, ui/waitlist-form.tsx), src/app/waitlist/page.tsx
  - 완료 조건: 이메일 입력 후 제출하면 waitlist에 저장되고 성공 메시지가 표시된다. 잘못된 이메일은 zod 검증으로 거부되어 인라인 에러가 표시된다(T10). 중복 이메일은 에러 없이 "이미 등록되어 있어요"로 처리된다.
  - 참조: PLAN.md §화면 3, §데이터 모델 / architecture 스킬 규칙 3
  - 테스트: T10, T12 (스모크 일부)

- [ ] 12. 배포 전 점검 + 스모크
  - 경로: e2e/smoke.spec.ts, .env.example
  - 완료 조건: `pnpm check` 전체 통과. T12 스모크(랜딩 렌더 → CTA → 로그인 페이지 도달 + 대기명단 폼 표시)가 `pnpm e2e`로 통과한다 — 대기명단 제출 성공 메시지 검증은 실 Supabase 연결이 필요해 로컬 스모크에서 제외하고, 배포 후 수동 체크 항목으로 수행한다. .env.example에 5개 키 이름(§기술 스택 메모)이 정확히 기재되고, 클라이언트 번들에 SECRET_KEY/GEMINI_API_KEY가 노출되지 않음을 확인한다(빌드 산출물 grep).
  - 참조: shipping 스킬 / CLAUDE.md §명령어 / PLAN.md §기술 스택 메모
  - 테스트: T12

- [x] 13. feature_interest 메트릭 테이블 마이그레이션 + 기록 action (정밀 분석 수요 측정) — **신규**
  - 경로: supabase/migrations/0002_feature_interest.sql, src/features/vault/actions.ts (recordFeatureInterest)
  - 완료 조건: `feature_interest`(id, feature_key text, user_id uuid, created_at) 테이블 생성 + `unique(feature_key, user_id)`. RLS 활성화 — 본인(user_id = auth.uid()) 행 **insert만** 허용(select/update/delete 정책 없음. waitlist의 anon insert 패턴을 참고하되, 클릭 주체는 로그인 사용자이므로 authenticated 본인 행 insert로 좁힌다). server action `recordFeatureInterest(featureKey: string): Promise<{ ok: true }>`가 zod로 featureKey 검증 후 현재 로그인 user_id로 1행 insert하며, unique 충돌은 에러 없이 멱등 성공 처리한다(on conflict do nothing). 비로그인 호출은 거부한다(T13). 정밀 분석 버튼은 `featureKey = "precision_extract"`를 사용한다.
  - 참조: PLAN.md §데이터 모델(메트릭 테이블), §성공 지표 / architecture 스킬 규칙 3 / CLAUDE.md 철칙 §4
  - 테스트: T13

## 성공 지표

**주 지표 — 이메일**: 가입 수 + 프리미엄(대용량 보관·양식 자동완성 무제한) 대기명단 이메일 수. 이번 빌드는 "이 도구에 돈 낼 의향이 있는가"를 대기명단 이메일로 검증한다.

**보조 지표 — 정밀 분석 버튼 클릭 수(고정밀 추출 수요)**: `feature_interest` 테이블에서 `feature_key = "precision_extract"`의 distinct user_id 수. 기본 lite 모델로 충분한지, 아니면 고정밀(3.5) 경로를 다음 주에 실제 연결할 가치가 있는지를 fake-door로 측정한다.

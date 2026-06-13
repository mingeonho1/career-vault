---
name: shipping
description: 배포 절차와 출시 체크리스트. 일요일 배포 작업, Vercel 배포, 도메인 연결, 계측 설정 시 참조한다.
---

# 배포 절차 (일요일 오전)

전제: reviewer가 `SHIP IT`을 반환한 상태. FAIL이 남아 있으면 이 스킬을 진행하지 않는다.

## 0. CI에서 `pnpm build`는 더미 env가 필요하다 (반복 함정)

`next build`는 "collecting page data" 단계에서 **서버 모듈을 import-time에 평가**한다. 우리는 env를 모듈 최상위에서 검증하고(`src/lib/env.ts`의 `envSchema.parse(process.env)`), SDK 클라이언트도 모듈 최상위에서 인스턴스화한다(`new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })` 등). 그래서 **env가 없는 CI 환경에서 `pnpm build`는 ZodError로 실패한다.** lint/typecheck/test는 env가 필요 없어 통과하므로 build 스텝에서만 터진다.

규칙: CI 워크플로의 **build 스텝에만** 형태만 맞는 더미 env를 준다 (URL 필드는 URL 형태로). 진짜 시크릿은 배포 플랫폼(Vercel)에서 주입하고, 그쪽 빌드는 실제 env로 검증되므로 prod env 누락 시 배포 빌드가 실패한다(fail-fast 유지). `.github/workflows/ci.yml`:

```yaml
- name: Build
  run: pnpm build
  env:
    SUPABASE_URL: https://placeholder.supabase.co
    SUPABASE_PUBLISHABLE_KEY: ci-placeholder
    # ...나머지 키도 더미 값. 키 이름은 src/lib/env.ts 스키마와 1:1로 맞춘다
```

대안(택1): env를 lazy 검증으로 바꾸고 SDK 클라이언트를 함수 안에서 생성하면 CI/로컬 빌드가 env를 아예 안 본다 — 단 Vercel 빌드도 env 검증을 건너뛰어 누락이 첫 요청 때 터지므로 fail-fast가 약해진다. 배포 시점 차단을 원하면 더미 env 방식을 쓴다.

## 1. 배포 전 점검

- [ ] `pnpm check` 통과 (로컬 최종 확인)
- [ ] `pnpm build` 로컬 성공 — 빌드 타임 에러는 로컬에서 잡는다
- [ ] env 점검: `.env.local`의 모든 키가 Vercel 프로젝트 env에 등록됐는가. `NEXT_PUBLIC_` 접두사가 붙은 값 중 비밀이어야 하는 게 없는가
- [ ] Supabase: RLS가 모든 테이블에 켜져 있는가 (꺼진 테이블 = 공개 테이블)

## 1-1. Supabase Auth (매직링크·OAuth 쓰는 빌드의 필수 대시보드 설정)

코드만 맞아도 대시보드 설정이 빠지면 로그인이 통째로 깨진다. 대시보드는 코드로 못 고치니 배포 전 직접 한다.

- [ ] **URL Configuration → Site URL** = 프로덕션 도메인 (`https://...`). 기본값이 `http://localhost:3000`이라, 안 바꾸면 매직링크가 localhost로 폴백한다.
- [ ] **URL Configuration → Redirect URLs** 허용목록에 프로덕션·로컬 콜백 둘 다 추가: `https://<도메인>/**`, `http://localhost:3000/**`. 허용목록에 없으면 우리가 보낸 `emailRedirectTo`가 무시되고 Site URL로 폴백된다(증상: 링크가 `/auth/callback`이 아닌 루트 `/?code=`로 떨어짐).
- [ ] **커스텀 SMTP** (Resend·SendGrid 등): 기본 메일은 시간당 2~3통 rate limit + "프로덕션용 아님"이고 발신 주소가 `noreply@mail.app.supabase.io`다. 가입 수를 지표로 삼는 빌드는 출시 트래픽에서 막히므로 사실상 필수.
- [ ] **Auth 메일 템플릿 브랜딩**: 기본 영문 템플릿은 어느 서비스인지 식별이 안 된다. 제품명 + 해요체 + design 스킬 색 토큰으로 교체한다 (템플릿 파일은 `supabase/email-templates/`에 두고 대시보드에 수동 적용).

## 2. 배포

1. `git push origin main` → Vercel 자동 배포 (또는 `vercel --prod`)
2. 배포 URL에서 스모크 테스트 — 사용자 여정 그대로 1회: 랜딩 진입 → 핵심 기능 1회 실행 → 결제/대기명단 제출 → 성공 화면 확인
3. 모바일 뷰포트 1회 확인 (트래픽 대부분은 모바일에서 온다)

## 3. 출시 마감재

- [ ] 메타: title, description, OG 이미지 1장 (og:image 1200x630 — 스크린샷에 제품명 얹은 정도면 충분)
- [ ] favicon
- [ ] 404 페이지에 홈 복귀 링크
- [ ] 계측: Vercel Analytics 또는 Plausible 활성화 + 핵심 이벤트 3개만 (방문은 기본 수집, `signup_submitted`, `payment_completed` 커스텀 이벤트)

## 4. 배포 직후

- [ ] BUILD_LOG.md에 배포 시각, 프로덕션 URL, 이번 빌드의 성공 지표(PLAN.md에 정의한 것) 기록
- [ ] README의 빌드 결과 표에 한 줄 추가: `주차 | 제품명 | URL | 검증 지표 | 결과(추후 기입)`
- [ ] `write-post` 스킬로 블로그 글 생성 단계로 이동

## 금지

- 일요일에 새 기능 추가 (배포일은 마감일이다. 발견된 개선점은 Backlog로)
- 스모크 테스트 생략 ("로컬에서 됐으니까"는 사고의 전조)
- 계측 없는 배포 (지표 없는 빌드는 검증이 아니라 취미다 — 킬 규칙을 적용할 데이터가 없어진다)

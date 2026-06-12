---
name: shipping
description: 배포 절차와 출시 체크리스트. 일요일 배포 작업, Vercel 배포, 도메인 연결, 계측 설정 시 참조한다.
---

# 배포 절차 (일요일 오전)

전제: reviewer가 `SHIP IT`을 반환한 상태. FAIL이 남아 있으면 이 스킬을 진행하지 않는다.

## 1. 배포 전 점검

- [ ] `pnpm check` 통과 (로컬 최종 확인)
- [ ] `pnpm build` 로컬 성공 — 빌드 타임 에러는 로컬에서 잡는다
- [ ] env 점검: `.env.local`의 모든 키가 Vercel 프로젝트 env에 등록됐는가. `NEXT_PUBLIC_` 접두사가 붙은 값 중 비밀이어야 하는 게 없는가
- [ ] Supabase: RLS가 모든 테이블에 켜져 있는가 (꺼진 테이블 = 공개 테이블)

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

# 이력 금고 (career-vault)

> 자소서 쓸 때마다 찾는 그 정보(학교·자격증·경력 날짜), 증명서 한 번 올려두고 3초 안에 복사하세요.

## 무엇 / 왜

- **무엇**: 증명서 파일(PDF/이미지)을 올리면 AI(Gemini)가 기관·명칭·날짜를 구조화 추출해 "이력 카드"로 저장하고, 항목별 원클릭 복사로 꺼내 쓴다. 보조: 지원서 양식 텍스트를 붙여넣으면 내 카드로 답안 매칭 생성.
- **왜**: 지원서를 10개 이상 쓰는 취준생·이직 준비자가 지원서 1건당 수십 분씩 증명서를 뒤지는 낭비를 없앤다.

## 로컬 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## 데이터 / 배포

- 공유 Supabase 사용(Auth=매직링크). 제품 고유 테이블: `career_vault_documents`, `career_vault_career_cards`, `career_vault_feature_interest` + 공유 `waitlist`(`source='career-vault'`) + storage 버킷 `career-vault-certificates`. 모든 테이블 RLS(본인 행만).
- env: `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` / `GEMINI_API_KEY`. 매직링크 redirect는 `siteUrl()` 자동 분기(커스텀 도메인이면 `SITE_URL`).
- 배포: `bash scripts/bootstrap.sh` 후 Supabase Auth → URL Configuration에 프로덕션 도메인 등록(매직링크). 이후 push마다 자동 배포.

> 주민등록번호는 어떤 테이블에도 저장하지 않는다. 범위 밖: 결제(대기명단으로 검증). (상세 PLAN.md)

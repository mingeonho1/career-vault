#!/usr/bin/env bash
# ============================================================
# bootstrap.sh — 새 MVP 레포를 GitHub + Vercel에 한 번에 올린다.
# ------------------------------------------------------------
# 새 빌드 디렉토리(템플릿 복제본)의 루트에서 실행:
#   bash scripts/bootstrap.sh
#
# 사전 준비 (각 1회):
#   - gh CLI 로그인:     gh auth login
#   - vercel CLI 로그인: vercel login   (npm i -g vercel)
#   - 공유 Supabase env가 Vercel "Shared Environment Variables"(팀 레벨)에 등록돼 있을 것
#     (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY / 필요시 GEMINI_API_KEY)
#
# 이 스크립트가 하는 일:
#   1) git 초기화 + 첫 커밋
#   2) GitHub public 레포 생성 + push
#   3) Vercel 프로젝트 생성 + Git 연결(= main에 push하면 자동 배포) + 첫 프로덕션 배포
#
# 끝나고 사람이 하는 1회 작업은 스크립트 마지막에 출력된다.
# ============================================================
set -euo pipefail

NAME="$(basename "$PWD")"   # 현재 디렉토리명 = 레포/프로젝트명
echo "▶ 부트스트랩: $NAME"

command -v gh >/dev/null     || { echo "✗ gh CLI 없음. brew install gh && gh auth login"; exit 1; }
command -v vercel >/dev/null || { echo "✗ vercel CLI 없음. npm i -g vercel && vercel login"; exit 1; }

# 1) git
if [ ! -d .git ]; then git init -b main; fi
git add -A
git commit -m "chore: 초기 커밋" >/dev/null 2>&1 || echo "  (커밋할 변경 없음 — 스킵)"

# 2) GitHub 레포 생성 + push (이미 origin 있으면 push만)
if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main
else
  gh repo create "$NAME" --public --source=. --remote=origin --push
fi

# 3) Vercel 프로젝트 + Git 연결(자동배포) + 첫 배포
vercel link --yes                      # 프레임워크(Next.js) 자동 감지, 프로젝트명=$NAME
vercel git connect >/dev/null 2>&1 || true   # main push → 자동 프로덕션 배포 연결
vercel --prod --yes                    # 첫 프로덕션 배포

cat <<EOF

✅ $NAME : GitHub + Vercel 연결 완료.
   이후로는 'git push origin main' 만 하면 Vercel이 자동 배포한다.

⚠️  남은 1회 수동 작업 (대시보드에서):
   1. Vercel → 이 프로젝트 → Settings → Environment Variables →
      팀 Shared 변수(SUPABASE_*, 필요시 GEMINI_API_KEY)를 이 프로젝트에 연결(Link).
      → 연결 후 한 번 재배포(Deployments → Redeploy)해야 env가 반영된다.
   2. 이 빌드가 새 테이블을 추가했다면:
      mvp-factory(origin)의 supabase-shared/schema.sql 에 이 제품 DDL을 합쳐 push한 뒤,
      그 파일을 공유 Supabase 프로젝트 SQL Editor에 붙여넣고 Run. (공유 DB 원본은 origin 기준)
   3. (커스텀 도메인 쓸 때만) 이 프로젝트 env에 SITE_URL=https://내도메인 추가.
      안 쓰면 siteUrl() 헬퍼가 Vercel 도메인을 자동 사용하므로 설정 불필요.
   4. (Auth 쓰는 빌드만) Supabase → Auth → URL Configuration 에 프로덕션 도메인 등록.
EOF

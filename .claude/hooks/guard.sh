#!/bin/bash
# guard.sh — PreToolUse(Bash) 훅
# 위험한 명령과 시크릿 노출을 결정론적으로 차단한다. exit 2 = 차단.

INPUT=$(cat)

# stdin JSON에서 실행하려는 명령 추출 (jq 있으면 jq, 없으면 python3)
if command -v jq >/dev/null 2>&1; then
  CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  CMD=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
fi

[ -z "$CMD" ] && exit 0

block() {
  echo "BLOCKED by guard.sh: $1" >&2
  echo "이 명령은 하네스 정책상 차단됩니다. 정말 필요하면 사용자가 직접 터미널에서 실행하세요." >&2
  exit 2
}

# 1) 파괴적 명령
echo "$CMD" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s' && \
  echo "$CMD" | grep -qE '(\s/|\s~|\s\$HOME|\s\.\s*$|\s\*)' && block "재귀 강제 삭제 (rm -rf)"

echo "$CMD" | grep -qE 'git\s+push\s+.*(--force|-f)\b' && block "force push"
echo "$CMD" | grep -qE 'git\s+reset\s+--hard\s+origin' && block "원격 기준 hard reset"
echo "$CMD" | grep -qE 'git\s+clean\s+-[a-zA-Z]*f' && block "git clean -f"

# 2) 시크릿 노출: .env 파일 내용을 출력하는 명령
echo "$CMD" | grep -qE '(cat|less|more|head|tail|bat|grep|awk|sed)\s+[^|;&]*\.env' && block ".env 파일 내용 출력"
echo "$CMD" | grep -qE '(curl|wget)\s+[^|;&]*\.env' && block ".env 파일 외부 전송"

# 3) 패키지 전역 오염
echo "$CMD" | grep -qE '(npm|pnpm|yarn)\s+.*\s-g(\s|$)' && block "전역 패키지 설치 (프로젝트 로컬로 설치하세요)"

exit 0

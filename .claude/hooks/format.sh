#!/bin/bash
# format.sh — PostToolUse(Edit|Write) 훅
# 편집된 파일에 prettier를 자동 적용한다. 에이전트가 포맷을 신경 쓸 컨텍스트조차 아낀다.
# 포맷 실패는 작업을 막지 않는다 (항상 exit 0).

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
else
  FILE=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
fi

[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)
    # prettier가 설치된 프로젝트에서만 동작. 출력은 버린다 (컨텍스트 오염 방지).
    npx --no-install prettier --write "$FILE" >/dev/null 2>&1
    ;;
  *.sh)
    chmod +x "$FILE" 2>/dev/null
    ;;
esac

exit 0

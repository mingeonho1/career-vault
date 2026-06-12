#!/bin/bash
# verify.sh — Stop 훅
# 세션 종료 전 pnpm check(lint + typecheck + test)를 강제한다.
# 실패 시 exit 2로 종료를 막고 수정을 요구한다. "통과 못 하면 끝낼 수 없다."

INPUT=$(cat)

# 무한 루프 방지: 이 훅이 이미 종료를 한 번 막은 상태면 통과시킨다.
if command -v jq >/dev/null 2>&1; then
  ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(printf '%s' "$INPUT" | python3 -c 'import json,sys; print(str(json.load(sys.stdin).get("stop_hook_active", False)).lower())' 2>/dev/null)
fi
[ "$ACTIVE" = "true" ] && exit 0

# 아직 앱 코드가 없는 단계(하네스만 있는 상태)면 통과
[ ! -f package.json ] && exit 0

# package.json에 check 스크립트가 없으면 통과 (셋업 초기)
if command -v jq >/dev/null 2>&1; then
  HAS_CHECK=$(jq -r '.scripts.check // empty' package.json 2>/dev/null)
else
  HAS_CHECK=$(python3 -c 'import json; print(json.load(open("package.json")).get("scripts",{}).get("check",""))' 2>/dev/null)
fi
[ -z "$HAS_CHECK" ] && exit 0

# 품질 게이트 실행
OUTPUT=$(pnpm check 2>&1)
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "QUALITY GATE FAILED — pnpm check가 실패했습니다. 아래 오류를 수정하기 전에는 작업을 종료할 수 없습니다:" >&2
  # 마지막 60줄만 전달해 컨텍스트를 아낀다
  echo "$OUTPUT" | tail -60 >&2
  exit 2
fi

exit 0

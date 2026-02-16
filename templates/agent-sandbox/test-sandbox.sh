#!/usr/bin/env bash
# ===========================================================================
# test-sandbox.sh — Integration test for TPMJS Agent Sandbox shell tools
#
# Usage:  ./test-sandbox.sh [SANDBOX_URL] [API_KEY]
#         Default URL: http://localhost:3002
# ===========================================================================
set -euo pipefail

SANDBOX_URL="${1:-http://localhost:3002}"
API_KEY="${2:-}"
SESSION_ID="test-$$-$(date +%s)"

AUTH_HEADER=""
if [ -n "$API_KEY" ]; then
  AUTH_HEADER="Authorization: Bearer $API_KEY"
fi

PASS=0
FAIL=0

# Helper: make an authenticated request
request() {
  local method="$1" path="$2"
  shift 2
  if [ -n "$AUTH_HEADER" ]; then
    curl -sf -X "$method" "${SANDBOX_URL}${path}" -H "Content-Type: application/json" -H "$AUTH_HEADER" "$@"
  else
    curl -sf -X "$method" "${SANDBOX_URL}${path}" -H "Content-Type: application/json" "$@"
  fi
}

# Helper: execute a tool in the session
exec_tool() {
  local tool_name="$1" params="$2"
  request POST /execute-tool -d "{
    \"packageName\": \"@tpmjs/official-sandbox-shell\",
    \"name\": \"$tool_name\",
    \"version\": \"0.1.0\",
    \"params\": $params,
    \"sessionId\": \"$SESSION_ID\"
  }"
}

# Helper: check test result
check() {
  local label="$1" result="$2" expected="$3"
  if echo "$result" | grep -q "$expected"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (expected '$expected')"
    echo "        Got: $result"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo " TPMJS Agent Sandbox — Shell Tools Test"
echo " URL: $SANDBOX_URL"
echo " Session: $SESSION_ID"
echo "============================================"
echo

# 1. Health check
echo "1. Health check"
HEALTH=$(request GET /health)
check "Server healthy" "$HEALTH" '"status":"ok"'
echo

# 2. Create session
echo "2. Create session"
SESSION=$(request POST /sessions -d "{\"sessionId\": \"$SESSION_ID\"}")
check "Session created" "$SESSION" '"success":true'
echo

# 3. shellExec — create a file with echo
echo "3. shellExec: echo hello > test.txt"
RESULT=$(exec_tool "shellExec" '{"command": "echo hello > test.txt && echo done"}')
check "Exit code 0" "$RESULT" '"exitCode":0'
check "Stdout has done" "$RESULT" 'done'
echo

# 4. readFile — verify content
echo "4. readFile: test.txt"
RESULT=$(exec_tool "readFile" '{"path": "test.txt"}')
check "Content is hello" "$RESULT" 'hello'
echo

# 5. writeFile — create src/index.js
echo "5. writeFile: src/index.js"
RESULT=$(exec_tool "writeFile" '{"path": "src/index.js", "content": "console.log(\"hi\");\n"}')
check "Write success" "$RESULT" '"success":true'
echo

# 6. listFiles — verify files exist
echo "6. listFiles: workspace root"
RESULT=$(exec_tool "listFiles" '{"recursive": true}')
check "Has test.txt" "$RESULT" 'test.txt'
check "Has src dir" "$RESULT" 'src'
echo

# 7. shellExec — git clone
echo "7. shellExec: git clone (shallow)"
RESULT=$(exec_tool "shellExec" '{"command": "git clone https://github.com/octocat/Hello-World.git --depth 1", "timeout": 60000}')
check "Git clone succeeded" "$RESULT" '"exitCode":0'
echo

# 8. listFiles — cloned repo
echo "8. listFiles: Hello-World/"
RESULT=$(exec_tool "listFiles" '{"path": "Hello-World"}')
check "Has README" "$RESULT" 'README'
echo

# 9. shellExec — git log in cloned repo
echo "9. shellExec: git log in Hello-World"
RESULT=$(exec_tool "shellExec" '{"command": "cd Hello-World && git log --oneline -3"}')
check "Git log output" "$RESULT" '"exitCode":0'
echo

# 10. Destroy session
echo "10. Destroy session"
DESTROY=$(request DELETE "/sessions/$SESSION_ID")
check "Session destroyed" "$DESTROY" '"success":true'
echo

# Summary
echo "============================================"
echo " Results: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

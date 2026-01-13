#!/bin/bash

# Test script for MCP endpoints
# Usage: ./test-mcp.sh <username> <collection-slug> [base-url] [api-key]
#
# The new MCP URL format is: /api/mcp/{username}/{slug}/{transport}
# Collection ID is also supported as slug for backwards compatibility

USERNAME=${1:-""}
COLLECTION_SLUG=${2:-""}
BASE_URL=${3:-"https://tpmjs.com"}
API_KEY=${4:-""}

if [ -z "$USERNAME" ] || [ -z "$COLLECTION_SLUG" ]; then
  echo "Usage: ./test-mcp.sh <username> <collection-slug> [base-url] [api-key]"
  echo "Example: ./test-mcp.sh ajax my-collection https://tpmjs.com tpmjs_sk_xxx"
  echo ""
  echo "Note: Collection ID can also be used as slug for backwards compatibility"
  exit 1
fi

# Build auth header if API key provided
AUTH_HEADER=""
if [ -n "$API_KEY" ]; then
  AUTH_HEADER="-H \"Authorization: Bearer $API_KEY\""
fi

echo "================================================"
echo "Testing MCP endpoints"
echo "Username: $USERNAME"
echo "Collection: $COLLECTION_SLUG"
echo "Base URL: $BASE_URL"
echo "Auth: ${API_KEY:+API key provided}"
echo "================================================"
echo ""

# Test 1: HTTP transport - GET (server info)
echo "1. Testing HTTP GET (server info)..."
echo "   GET $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http"
eval curl -s "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http" $AUTH_HEADER | jq .
echo ""

# Test 2: HTTP transport - initialize
echo "2. Testing HTTP POST (initialize)..."
echo "   POST $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http"
eval curl -s -X POST "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}' | jq .
echo ""

# Test 3: HTTP transport - tools/list
echo "3. Testing HTTP POST (tools/list)..."
echo "   POST $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http"
eval curl -s -X POST "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/http" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}' | jq .
echo ""

# Test 4: SSE transport - GET (event stream)
echo "4. Testing SSE GET (event stream)..."
echo "   GET $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse"
eval curl -s -N "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse" $AUTH_HEADER &
SSE_PID=$!
sleep 2
kill $SSE_PID 2>/dev/null
echo ""
echo ""

# Test 5: SSE transport - initialize
echo "5. Testing SSE POST (initialize)..."
echo "   POST $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse"
eval curl -s -X POST "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
echo ""
echo ""

# Test 6: SSE transport - tools/list
echo "6. Testing SSE POST (tools/list)..."
echo "   POST $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse"
eval curl -s -X POST "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/sse" \
  -H "Content-Type: application/json" \
  $AUTH_HEADER \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
echo ""
echo ""

# Test 7: Invalid transport
echo "7. Testing invalid transport..."
echo "   GET $BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/invalid"
eval curl -s "$BASE_URL/api/mcp/$USERNAME/$COLLECTION_SLUG/invalid" $AUTH_HEADER | jq .
echo ""

echo "================================================"
echo "Tests complete!"
echo "================================================"

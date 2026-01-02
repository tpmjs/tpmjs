#!/bin/bash

# Test script for MCP endpoints
# Usage: ./test-mcp.sh <collection-id> [base-url]

COLLECTION_ID=${1:-""}
BASE_URL=${2:-"https://tpmjs.com"}

if [ -z "$COLLECTION_ID" ]; then
  echo "Usage: ./test-mcp.sh <collection-id> [base-url]"
  echo "Example: ./test-mcp.sh clx123abc https://tpmjs.com"
  exit 1
fi

echo "================================================"
echo "Testing MCP endpoints for collection: $COLLECTION_ID"
echo "Base URL: $BASE_URL"
echo "================================================"
echo ""

# Test 1: HTTP transport - GET (server info)
echo "1. Testing HTTP GET (server info)..."
echo "   GET $BASE_URL/api/collections/$COLLECTION_ID/mcp/http"
curl -s "$BASE_URL/api/collections/$COLLECTION_ID/mcp/http" | jq .
echo ""

# Test 2: HTTP transport - initialize
echo "2. Testing HTTP POST (initialize)..."
echo "   POST $BASE_URL/api/collections/$COLLECTION_ID/mcp/http"
curl -s -X POST "$BASE_URL/api/collections/$COLLECTION_ID/mcp/http" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}' | jq .
echo ""

# Test 3: HTTP transport - tools/list
echo "3. Testing HTTP POST (tools/list)..."
echo "   POST $BASE_URL/api/collections/$COLLECTION_ID/mcp/http"
curl -s -X POST "$BASE_URL/api/collections/$COLLECTION_ID/mcp/http" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}' | jq .
echo ""

# Test 4: SSE transport - GET (event stream)
echo "4. Testing SSE GET (event stream)..."
echo "   GET $BASE_URL/api/collections/$COLLECTION_ID/mcp/sse"
curl -s -N "$BASE_URL/api/collections/$COLLECTION_ID/mcp/sse" &
SSE_PID=$!
sleep 2
kill $SSE_PID 2>/dev/null
echo ""
echo ""

# Test 5: SSE transport - initialize
echo "5. Testing SSE POST (initialize)..."
echo "   POST $BASE_URL/api/collections/$COLLECTION_ID/mcp/sse"
curl -s -X POST "$BASE_URL/api/collections/$COLLECTION_ID/mcp/sse" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
echo ""
echo ""

# Test 6: SSE transport - tools/list
echo "6. Testing SSE POST (tools/list)..."
echo "   POST $BASE_URL/api/collections/$COLLECTION_ID/mcp/sse"
curl -s -X POST "$BASE_URL/api/collections/$COLLECTION_ID/mcp/sse" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
echo ""
echo ""

# Test 7: Invalid transport
echo "7. Testing invalid transport..."
echo "   GET $BASE_URL/api/collections/$COLLECTION_ID/mcp/invalid"
curl -s "$BASE_URL/api/collections/$COLLECTION_ID/mcp/invalid" | jq .
echo ""

echo "================================================"
echo "Tests complete!"
echo "================================================"

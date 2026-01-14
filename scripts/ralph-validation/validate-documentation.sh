#!/bin/bash
# Validation script for Priority 3: Documentation & Onboarding
# Exit 0 = validation passes, Exit 1 = validation fails

set -e

echo "=== Validating Documentation & Onboarding ==="
echo ""

ERRORS=0

# Check 1: API documentation pages
echo "1. Checking API documentation..."
API_DOCS_DIR="apps/web/src/app/docs/api"
if [[ -d "$API_DOCS_DIR" ]]; then
    # Check for key API doc pages
    REQUIRED_DOCS=("tools" "agents" "collections" "authentication")
    for doc in "${REQUIRED_DOCS[@]}"; do
        if [[ -f "$API_DOCS_DIR/$doc/page.tsx" ]] || [[ -f "$API_DOCS_DIR/$doc/page.mdx" ]]; then
            echo "   ✓ API docs: $doc exists"
        else
            echo "   ✗ API docs: $doc missing"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo "   ✗ API documentation directory missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 2: Interactive tutorial/quickstart
echo "2. Checking interactive tutorial..."
if [[ -f "apps/web/src/app/docs/quickstart/page.tsx" ]] || \
   [[ -f "apps/web/src/app/tutorial/page.tsx" ]] || \
   [[ -f "apps/web/src/app/getting-started/page.tsx" ]]; then
    echo "   ✓ Tutorial/quickstart page exists"
else
    echo "   ✗ Interactive tutorial missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 3: Example code snippets
echo "3. Checking example code..."
EXAMPLES_COUNT=$(grep -r '\`\`\`typescript\|\`\`\`javascript\|\`\`\`bash' apps/web/src/app/docs/ 2>/dev/null | wc -l || echo "0")
if [[ "$EXAMPLES_COUNT" -gt 20 ]]; then
    echo "   ✓ Found $EXAMPLES_COUNT code examples in docs"
else
    echo "   ✗ Insufficient code examples (found: $EXAMPLES_COUNT, need: 20+)"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 4: SDK documentation
echo "4. Checking SDK documentation..."
if [[ -f "apps/web/src/app/docs/sdk/page.tsx" ]] || \
   [[ -d "apps/web/src/app/docs/sdk" ]]; then
    echo "   ✓ SDK documentation exists"
else
    echo "   ✗ SDK documentation missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 5: Tool development guide
echo "5. Checking tool development guide..."
if [[ -f "apps/web/src/app/docs/publishing/page.tsx" ]] || \
   [[ -f "apps/web/src/app/publish/page.tsx" ]]; then

    # Check for comprehensive content
    FILE=$(find apps/web/src/app -name "page.tsx" -path "*publish*" -o -name "page.tsx" -path "*docs/publishing*" 2>/dev/null | head -1)
    if [[ -n "$FILE" ]] && [[ $(wc -l < "$FILE") -gt 100 ]]; then
        echo "   ✓ Tool development guide exists and is comprehensive"
    else
        echo "   ⚠ Tool development guide exists but may be short"
    fi
else
    echo "   ✗ Tool development guide missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 6: API endpoint documentation completeness
echo "6. Checking API endpoint coverage..."
API_ROUTES=$(find apps/web/src/app/api -name "route.ts" 2>/dev/null | wc -l)
DOCUMENTED_ROUTES=$(grep -r "@api\|@route\|endpoint" apps/web/src/app/docs/api/ 2>/dev/null | wc -l || echo "0")

echo "   API routes: $API_ROUTES"
echo "   Documented references: $DOCUMENTED_ROUTES"

if [[ "$DOCUMENTED_ROUTES" -gt "$((API_ROUTES / 2))" ]]; then
    echo "   ✓ Good documentation coverage"
else
    echo "   ✗ Insufficient API documentation coverage"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 7: Onboarding flow components
echo "7. Checking onboarding components..."
if grep -rq "onboarding\|firstTime\|welcome\|tutorial" apps/web/src/components/ 2>/dev/null || \
   [[ -d "apps/web/src/components/onboarding" ]]; then
    echo "   ✓ Onboarding components exist"
else
    echo "   ✗ Onboarding components missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 8: Example agents/collections
echo "8. Checking example templates..."
if grep -rq "example\|template\|starter" apps/web/src/app/docs/ 2>/dev/null || \
   [[ -d "apps/web/src/app/templates" ]]; then
    echo "   ✓ Example templates exist"
else
    echo "   ✗ Example templates missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 9: Search/navigation in docs
echo "9. Checking docs navigation..."
if [[ -f "apps/web/src/components/docs/DocsSidebar.tsx" ]] || \
   [[ -f "apps/web/src/app/docs/layout.tsx" ]]; then
    echo "   ✓ Docs navigation exists"
else
    echo "   ✗ Docs navigation missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 10: Troubleshooting guide
echo "10. Checking troubleshooting guide..."
if [[ -f "apps/web/src/app/docs/troubleshooting/page.tsx" ]] || \
   grep -rq "troubleshoot\|common errors\|FAQ" apps/web/src/app/docs/ 2>/dev/null; then
    echo "   ✓ Troubleshooting content exists"
else
    echo "   ✗ Troubleshooting guide missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== Validation Summary ==="
if [[ $ERRORS -eq 0 ]]; then
    echo "✓ All checks passed!"
    exit 0
else
    echo "✗ $ERRORS check(s) failed"
    exit 1
fi

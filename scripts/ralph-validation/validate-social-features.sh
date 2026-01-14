#!/bin/bash
# Validation script for Priority 2: Social Proof & Discovery Features
# Exit 0 = validation passes, Exit 1 = validation fails

set -e

echo "=== Validating Social Proof & Discovery Features ==="
echo ""

ERRORS=0

# Check 1: Rating system API routes
echo "1. Checking rating API routes..."
if [[ -f "apps/web/src/app/api/tools/[id]/rate/route.ts" ]]; then
    echo "   ✓ Tool rating route exists"

    # Check for POST handler
    if grep -q "export async function POST" "apps/web/src/app/api/tools/[id]/rate/route.ts"; then
        echo "   ✓ POST handler for rating exists"
    else
        echo "   ✗ Missing POST handler for rating"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ Tool rating route missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 2: Review system API routes
echo "2. Checking review API routes..."
if [[ -f "apps/web/src/app/api/tools/[id]/reviews/route.ts" ]]; then
    echo "   ✓ Tool reviews route exists"

    if grep -q "export async function GET" "apps/web/src/app/api/tools/[id]/reviews/route.ts"; then
        echo "   ✓ GET handler for reviews exists"
    else
        echo "   ✗ Missing GET handler for reviews"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "export async function POST" "apps/web/src/app/api/tools/[id]/reviews/route.ts"; then
        echo "   ✓ POST handler for reviews exists"
    else
        echo "   ✗ Missing POST handler for reviews"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ Tool reviews route missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 3: Database schema for ratings/reviews
echo "3. Checking database schema..."
if grep -q "model ToolRating" "packages/db/prisma/schema.prisma"; then
    echo "   ✓ ToolRating model exists"
else
    echo "   ✗ ToolRating model missing"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "model ToolReview" "packages/db/prisma/schema.prisma"; then
    echo "   ✓ ToolReview model exists"
else
    echo "   ✗ ToolReview model missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 4: Trending tools API
echo "4. Checking trending tools..."
if [[ -f "apps/web/src/app/api/tools/trending/route.ts" ]]; then
    echo "   ✓ Trending tools route exists"
else
    echo "   ✗ Trending tools route missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 5: UI Components for ratings/reviews
echo "5. Checking UI components..."
if [[ -f "packages/ui/src/Rating/Rating.tsx" ]] || [[ -f "apps/web/src/components/Rating.tsx" ]]; then
    echo "   ✓ Rating component exists"
else
    echo "   ✗ Rating component missing"
    ERRORS=$((ERRORS + 1))
fi

if [[ -f "packages/ui/src/ReviewCard/ReviewCard.tsx" ]] || [[ -f "apps/web/src/components/ReviewCard.tsx" ]]; then
    echo "   ✓ ReviewCard component exists"
else
    echo "   ✗ ReviewCard component missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 6: Tool page shows ratings
echo "6. Checking tool page integration..."
if [[ -f "apps/web/src/app/tool/[slug]/page.tsx" ]]; then
    if grep -q "Rating\|rating\|averageRating" "apps/web/src/app/tool/[slug]/page.tsx"; then
        echo "   ✓ Tool page shows ratings"
    else
        echo "   ✗ Tool page missing rating display"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "Review\|review" "apps/web/src/app/tool/[slug]/page.tsx"; then
        echo "   ✓ Tool page shows reviews"
    else
        echo "   ✗ Tool page missing reviews display"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠ Tool page not found at expected location"
fi

echo ""

# Check 7: Average rating calculation
echo "7. Checking rating aggregation..."
if grep -q "averageRating" "packages/db/prisma/schema.prisma" || \
   grep -rq "AVG.*rating\|averageRating" "apps/web/src/app/api/"; then
    echo "   ✓ Rating aggregation exists"
else
    echo "   ✗ Rating aggregation missing"
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

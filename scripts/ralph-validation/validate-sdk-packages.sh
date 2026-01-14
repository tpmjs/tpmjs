#!/bin/bash
# Validation script for Priority 1: Complete SDK Packages
# Exit 0 = validation passes, Exit 1 = validation fails

set -e

echo "=== Validating SDK Packages ==="
echo ""

ERRORS=0

# Check 1: @tpmjs/registry-search package exists
echo "1. Checking @tpmjs/registry-search package..."
if [[ -d "packages/registry-search" ]] && [[ -f "packages/registry-search/package.json" ]]; then
    echo "   ✓ Package directory exists"

    # Check for src/index.ts
    if [[ -f "packages/registry-search/src/index.ts" ]]; then
        echo "   ✓ Source file exists"
    else
        echo "   ✗ Missing src/index.ts"
        ERRORS=$((ERRORS + 1))
    fi

    # Check package.json has correct name
    if grep -q '"name": "@tpmjs/registry-search"' packages/registry-search/package.json; then
        echo "   ✓ Package name correct"
    else
        echo "   ✗ Package name incorrect"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ Package directory missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 2: @tpmjs/registry-execute package exists
echo "2. Checking @tpmjs/registry-execute package..."
if [[ -d "packages/registry-execute" ]] && [[ -f "packages/registry-execute/package.json" ]]; then
    echo "   ✓ Package directory exists"

    if [[ -f "packages/registry-execute/src/index.ts" ]]; then
        echo "   ✓ Source file exists"
    else
        echo "   ✗ Missing src/index.ts"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q '"name": "@tpmjs/registry-execute"' packages/registry-execute/package.json; then
        echo "   ✓ Package name correct"
    else
        echo "   ✗ Package name incorrect"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ Package directory missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 3: TypeScript compiles
echo "3. Checking TypeScript compilation..."
if command -v pnpm &> /dev/null; then
    if pnpm --filter=@tpmjs/registry-search type-check 2>/dev/null; then
        echo "   ✓ registry-search compiles"
    else
        echo "   ✗ registry-search has type errors"
        ERRORS=$((ERRORS + 1))
    fi

    if pnpm --filter=@tpmjs/registry-execute type-check 2>/dev/null; then
        echo "   ✓ registry-execute compiles"
    else
        echo "   ✗ registry-execute has type errors"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠ pnpm not available, skipping type check"
fi

echo ""

# Check 4: Packages have required exports
echo "4. Checking required exports..."
REQUIRED_SEARCH_EXPORTS=("searchTools" "getToolById" "getTrendingTools")
REQUIRED_EXECUTE_EXPORTS=("executeToolCall" "createToolClient")

if [[ -f "packages/registry-search/src/index.ts" ]]; then
    for export in "${REQUIRED_SEARCH_EXPORTS[@]}"; do
        if grep -q "export.*$export" packages/registry-search/src/index.ts 2>/dev/null || \
           grep -q "export.*$export" packages/registry-search/src/*.ts 2>/dev/null; then
            echo "   ✓ registry-search exports $export"
        else
            echo "   ✗ registry-search missing export: $export"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

if [[ -f "packages/registry-execute/src/index.ts" ]]; then
    for export in "${REQUIRED_EXECUTE_EXPORTS[@]}"; do
        if grep -q "export.*$export" packages/registry-execute/src/index.ts 2>/dev/null || \
           grep -q "export.*$export" packages/registry-execute/src/*.ts 2>/dev/null; then
            echo "   ✓ registry-execute exports $export"
        else
            echo "   ✗ registry-execute missing export: $export"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

echo ""

# Check 5: Tests exist and pass
echo "5. Checking tests..."
if [[ -d "packages/registry-search/src/__tests__" ]] || [[ -d "packages/registry-search/test" ]]; then
    echo "   ✓ registry-search has tests"
else
    echo "   ✗ registry-search missing tests"
    ERRORS=$((ERRORS + 1))
fi

if [[ -d "packages/registry-execute/src/__tests__" ]] || [[ -d "packages/registry-execute/test" ]]; then
    echo "   ✓ registry-execute has tests"
else
    echo "   ✗ registry-execute missing tests"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check 6: README documentation
echo "6. Checking documentation..."
if [[ -f "packages/registry-search/README.md" ]]; then
    if [[ $(wc -l < packages/registry-search/README.md) -gt 20 ]]; then
        echo "   ✓ registry-search has README"
    else
        echo "   ✗ registry-search README too short"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ registry-search missing README"
    ERRORS=$((ERRORS + 1))
fi

if [[ -f "packages/registry-execute/README.md" ]]; then
    if [[ $(wc -l < packages/registry-execute/README.md) -gt 20 ]]; then
        echo "   ✓ registry-execute has README"
    else
        echo "   ✗ registry-execute README too short"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ registry-execute missing README"
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

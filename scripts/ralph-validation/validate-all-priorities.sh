#!/bin/bash
# Master validation script for top 3 priorities
# Exit 0 = all validations pass, Exit 1 = any validation fails

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  TPMJS Top 3 Priorities Validation"
echo "========================================"
echo ""

FAILED=0

# Priority 1: SDK Packages
echo ">>> Priority 1: SDK Packages"
echo ""
if "$SCRIPT_DIR/validate-sdk-packages.sh"; then
    echo ""
    echo ">>> Priority 1: PASSED"
else
    echo ""
    echo ">>> Priority 1: FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

# Priority 2: Social Features
echo ">>> Priority 2: Social Proof & Discovery"
echo ""
if "$SCRIPT_DIR/validate-social-features.sh"; then
    echo ""
    echo ">>> Priority 2: PASSED"
else
    echo ""
    echo ">>> Priority 2: FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

# Priority 3: Documentation
echo ">>> Priority 3: Documentation & Onboarding"
echo ""
if "$SCRIPT_DIR/validate-documentation.sh"; then
    echo ""
    echo ">>> Priority 3: PASSED"
else
    echo ""
    echo ">>> Priority 3: FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "========================================"
echo "  Final Summary"
echo "========================================"
if [[ $FAILED -eq 0 ]]; then
    echo "✓ All 3 priorities complete!"
    exit 0
else
    echo "✗ $FAILED priority/priorities still need work"
    exit 1
fi

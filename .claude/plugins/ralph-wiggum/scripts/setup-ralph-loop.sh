#!/bin/bash
# Setup Ralph Loop - Initialize the iterative development loop
# Usage: setup-ralph-loop.sh "PROMPT" [--max-iterations N] [--completion-promise TEXT] [--validation-script PATH]

set -euo pipefail

STATE_FILE=".claude/ralph-loop.local.md"

# Default values
MAX_ITERATIONS=20
COMPLETION_PROMISE=""
VALIDATION_SCRIPT=""
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        --completion-promise)
            COMPLETION_PROMISE="$2"
            shift 2
            ;;
        --validation-script)
            VALIDATION_SCRIPT="$2"
            shift 2
            ;;
        --help|-h)
            cat << EOF
Ralph Loop Setup

Usage: setup-ralph-loop.sh "PROMPT" [OPTIONS]

Options:
  --max-iterations N       Maximum iterations before stopping (default: 20, 0 = unlimited)
  --completion-promise TXT Phrase to output when complete (use <promise>TXT</promise>)
  --validation-script PATH Script to run for validation (exit 0 = pass)
  --help, -h               Show this help

Example:
  setup-ralph-loop.sh "Build the SDK package" --max-iterations 10 --validation-script ./validate.sh
EOF
            exit 0
            ;;
        *)
            if [[ -z "$PROMPT" ]]; then
                PROMPT="$1"
            else
                PROMPT="$PROMPT $1"
            fi
            shift
            ;;
    esac
done

# Validate prompt
if [[ -z "$PROMPT" ]]; then
    echo "Error: PROMPT is required" >&2
    exit 1
fi

# Validate max iterations
if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
    echo "Error: --max-iterations must be a number" >&2
    exit 1
fi

# Validate validation script exists if provided
if [[ -n "$VALIDATION_SCRIPT" ]] && [[ ! -f "$VALIDATION_SCRIPT" ]]; then
    echo "Error: Validation script not found: $VALIDATION_SCRIPT" >&2
    exit 1
fi

# Create state directory
mkdir -p "$(dirname "$STATE_FILE")"

# Create state file
cat << EOF > "$STATE_FILE"
---
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: "$COMPLETION_PROMISE"
validation_script: "$VALIDATION_SCRIPT"
prompt: "$PROMPT"
started_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
---

# Ralph Loop State

This file tracks the state of an active Ralph loop. DO NOT DELETE while loop is running.

## Configuration
- **Task**: $PROMPT
- **Max Iterations**: $MAX_ITERATIONS
- **Validation Script**: ${VALIDATION_SCRIPT:-"None"}
- **Completion Promise**: ${COMPLETION_PROMISE:-"None (validation only)"}

## Progress Log

Iteration logs will be appended below as the loop progresses.

---
EOF

echo "Ralph loop initialized!"
echo "  Task: $PROMPT"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Validation: ${VALIDATION_SCRIPT:-"None"}"
echo "  Completion promise: ${COMPLETION_PROMISE:-"None"}"
echo ""
echo "The loop will continue until:"
if [[ -n "$VALIDATION_SCRIPT" ]]; then
    echo "  - Validation script passes ($VALIDATION_SCRIPT returns exit code 0)"
fi
if [[ -n "$COMPLETION_PROMISE" ]]; then
    echo "  - You output: <promise>$COMPLETION_PROMISE</promise>"
fi
echo "  - OR max iterations ($MAX_ITERATIONS) is reached"

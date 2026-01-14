#!/bin/bash
# Ralph Wiggum Stop Hook - Self-referential loop for iterative development
# This hook intercepts the Stop event and decides whether to continue the loop

set -euo pipefail

STATE_FILE=".claude/ralph-loop.local.md"
TRANSCRIPT_FILE="${CLAUDE_TRANSCRIPT:-}"

# Check if ralph loop is active
if [[ ! -f "$STATE_FILE" ]]; then
    # No active loop, allow normal exit
    exit 0
fi

# Parse the state file frontmatter
parse_frontmatter() {
    local key="$1"
    sed -n '/^---$/,/^---$/p' "$STATE_FILE" | grep "^${key}:" | sed "s/^${key}: *//" | tr -d '"'
}

iteration=$(parse_frontmatter "iteration")
max_iterations=$(parse_frontmatter "max_iterations")
completion_promise=$(parse_frontmatter "completion_promise")
prompt=$(parse_frontmatter "prompt")
validation_script=$(parse_frontmatter "validation_script")

# Validate numeric fields
if ! [[ "$iteration" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid iteration count in state file" >&2
    rm -f "$STATE_FILE"
    exit 0
fi

if ! [[ "$max_iterations" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid max_iterations in state file" >&2
    rm -f "$STATE_FILE"
    exit 0
fi

# Check if max iterations reached
if [[ "$max_iterations" -gt 0 ]] && [[ "$iteration" -ge "$max_iterations" ]]; then
    echo "Ralph loop reached max iterations ($max_iterations). Exiting." >&2
    rm -f "$STATE_FILE"
    exit 0
fi

# Run validation script if provided
validation_passed=false
if [[ -n "$validation_script" ]] && [[ -f "$validation_script" ]]; then
    echo "Running validation script: $validation_script" >&2
    if bash "$validation_script" 2>&1; then
        validation_passed=true
        echo "Validation PASSED!" >&2
    else
        echo "Validation FAILED. Continuing loop..." >&2
    fi
fi

# Check for completion promise in transcript
if [[ -n "$completion_promise" ]] && [[ -n "$TRANSCRIPT_FILE" ]] && [[ -f "$TRANSCRIPT_FILE" ]]; then
    # Get the last assistant message
    last_message=$(tail -100 "$TRANSCRIPT_FILE" | grep -o '<promise>[^<]*</promise>' | tail -1 | sed 's/<promise>\(.*\)<\/promise>/\1/' || true)

    if [[ "$last_message" == "$completion_promise" ]]; then
        # Also check if validation passed (if validation script exists)
        if [[ -z "$validation_script" ]] || [[ "$validation_passed" == "true" ]]; then
            echo "Completion promise matched and validation passed. Ralph loop complete!" >&2
            rm -f "$STATE_FILE"
            exit 0
        else
            echo "Completion promise matched but validation failed. Continuing..." >&2
        fi
    fi
fi

# If validation passed without explicit promise, we can exit
if [[ "$validation_passed" == "true" ]] && [[ -z "$completion_promise" ]]; then
    echo "Validation passed. Ralph loop complete!" >&2
    rm -f "$STATE_FILE"
    exit 0
fi

# Increment iteration
new_iteration=$((iteration + 1))

# Update state file
sed -i.bak "s/^iteration: .*/iteration: $new_iteration/" "$STATE_FILE"
rm -f "${STATE_FILE}.bak"

# Build the continuation message
cat << EOF
{
  "decision": "block",
  "reason": "Ralph loop iteration $new_iteration of $max_iterations",
  "message": "
---
RALPH LOOP - Iteration $new_iteration / $max_iterations
---

Continue working on the task. Your previous iteration's work is preserved in the codebase.

TASK: $prompt

$(if [[ -n "$validation_script" ]]; then echo "VALIDATION: Run the validation to check progress. Script: $validation_script"; fi)
$(if [[ -n "$completion_promise" ]]; then echo "COMPLETION: Output <promise>$completion_promise</promise> ONLY when the task is completely done AND validation passes."; fi)

Review what you've done so far and continue from where you left off.
"
}
EOF

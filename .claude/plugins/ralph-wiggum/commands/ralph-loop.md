---
description: Start Ralph Wiggum loop in current session
command: "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ralph-loop.sh" $ARGUMENTS
---

# Ralph Loop

Start an iterative development loop that continues until the task is complete.

## Usage

```
/ralph-loop "Your task description" [--max-iterations N] [--validation-script PATH] [--completion-promise TEXT]
```

## How It Works

1. You provide a task and optional validation criteria
2. Claude works on the task
3. When Claude tries to exit, the stop hook intercepts
4. If validation fails OR completion promise not met, the loop continues
5. Claude sees previous work and continues iterating
6. Loop ends when validation passes or max iterations reached

## Important Rules

- If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE
- Do NOT use false completion promises as an exit strategy
- The loop persists until genuine completion is achieved
- Use validation scripts for programmatic verification

## Examples

```bash
# With validation script only
/ralph-loop "Build the SDK package" --validation-script ./scripts/validate-sdk.sh

# With completion promise
/ralph-loop "Fix all type errors" --completion-promise "ALL_TYPES_PASS"

# With both
/ralph-loop "Complete feature X" --max-iterations 15 --validation-script ./validate.sh --completion-promise "FEATURE_COMPLETE"
```

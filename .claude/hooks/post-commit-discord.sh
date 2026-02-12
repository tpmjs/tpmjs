#!/bin/bash
# Claude Code hook: After a successful git commit, prompt Claude to post to Discord
# Runs as a PostToolUse hook on the Bash tool

INPUT=$(cat)

# Extract the command that was run
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only trigger on git commit commands (not amend, not rebase, not merge)
if echo "$COMMAND" | grep -qE 'git commit\b' && \
   ! echo "$COMMAND" | grep -qE '(--amend|rebase|merge)'; then
  # Check if the tool succeeded - use tool_response (not tool_output)
  STDOUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty' 2>/dev/null)
  STDERR=$(echo "$INPUT" | jq -r '.tool_response.stderr // empty' 2>/dev/null)
  RETURN_CODE=$(echo "$INPUT" | jq -r '.tool_response.returnCode // "1"' 2>/dev/null)

  # Only proceed if the command succeeded
  if [[ "$RETURN_CODE" == "0" ]]; then
    # Extract commit info from stdout/stderr
    COMMIT_LINE=$(echo "$STDOUT$STDERR" | grep -oE '\[.+ [a-f0-9]+\] .+' | head -1)

    if [[ -n "$COMMIT_LINE" ]]; then
      # Output as JSON with reason field so Claude sees it as context
      cat <<HOOKEOF
{"decision":"block","reason":"[Post-Commit Hook] A git commit was just made: ${COMMIT_LINE}\n\nPlease post a brief summary (2-3 sentences) of what was committed to the #tpmjs Discord channel (channel ID: 1442666515425132644). Include the commit hash."}
HOOKEOF
      exit 2
    fi
  fi
fi

exit 0

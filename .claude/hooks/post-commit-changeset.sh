#!/bin/bash
# Claude Code hook: After a successful git commit, prompt Claude to consider creating a changeset
# Runs as a PostToolUse hook on the Bash tool

INPUT=$(cat)

# Extract the command that was run
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Match any git commit command (but not amend, rebase, merge)
if echo "$COMMAND" | grep -qE 'git commit\b' && \
   ! echo "$COMMAND" | grep -qE '(--amend|rebase|merge)'; then

  # Check if the tool succeeded
  RETURN_CODE=$(echo "$INPUT" | jq -r '.tool_response.returnCode // "1"' 2>/dev/null)

  if [[ "$RETURN_CODE" == "0" ]]; then
    STDOUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty' 2>/dev/null)
    STDERR=$(echo "$INPUT" | jq -r '.tool_response.stderr // empty' 2>/dev/null)
    COMMIT_LINE=$(echo "$STDOUT$STDERR" | grep -oE '\[.+ [a-f0-9]+\] .+' | head -1)

    if [[ -n "$COMMIT_LINE" ]]; then
      cat <<HOOKEOF
{"decision":"block","reason":"[Changeset Hook] A git commit was just made: ${COMMIT_LINE}\n\nCheck if this commit changes any publishable packages (packages/db, packages/types, packages/ui, packages/tools/official/*). If it does, create a changeset file in .changeset/ for the affected packages.\n\nTo create a changeset: run \`pnpm changeset\` interactively is NOT supported. Instead, create a markdown file in .changeset/ with a random name (e.g. .changeset/brave-dogs-fly.md) with this format:\n\n---\n'@tpmjs/package-name': patch|minor|major\n---\n\nBrief description of what changed.\n\nIf the commit only affects apps/web or other non-publishable packages (listed in changeset config ignore), skip creating a changeset and just say so."}
HOOKEOF
      exit 2
    fi
  fi
fi

exit 0

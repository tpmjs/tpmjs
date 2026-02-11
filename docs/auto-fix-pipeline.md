# Auto-Fix Pipeline

End-to-end pipeline for automatically fixing production errors detected by Sentry.

## Flow

```
Sentry detects error
  → Sentry GitHub integration creates issue (auto-fix label)
  → claude-auto-fix.yml triggers
  → Loop check (max 2 attempts)
  → Adds claude-working label
  → Posts @claude comment
  → claude.yml picks up the @claude mention
  → Claude reads .claude/pipelines/auto-fix.md
  → Claude analyzes, fixes, validates
  → Claude creates PR (fix/sentry-<issue-number>)
  → Human reviews and merges PR
  → Error resolved in next deployment
```

## Setup Requirements

1. **Sentry project** configured with DSN (see [docs/sentry-setup.md](./sentry-setup.md))
2. **Sentry GitHub integration** installed on the tpmjs repo
3. **Sentry alert rule** that creates GitHub issues with the `auto-fix` label for new/regressed errors
4. **GitHub labels** created: `auto-fix`, `production-error`, `claude-working`, `fix-submitted`, `needs-human-review`
5. **Claude Code Action** configured with `CLAUDE_CODE_OAUTH_TOKEN` secret

## Manual Triggering

### Via GitHub UI

1. Create a new issue using the "Sentry Auto-Fix" template
2. Fill in the error details
3. The `auto-fix` label is applied automatically by the template

### Via workflow dispatch

```bash
gh workflow run claude-auto-fix.yml -f issue_number=123
```

### Re-triggering a failed attempt

1. Remove the `needs-human-review` label
2. Re-apply the `auto-fix` label
3. Note: after 2 total attempts, it will escalate again

## Troubleshooting

### Claude didn't respond

- Check if `claude.yml` workflow ran: `gh run list --workflow=claude.yml`
- Verify the `@claude` comment was posted on the issue
- Check the `claude-label-trigger` job specifically

### Fix PR has type errors

- The auto-fix pipeline validates before creating PRs, but edge cases can slip through
- Review the PR, fix manually, or close and re-trigger

### Error is in a dependency

- Claude will detect this and escalate with `needs-human-review`
- Check the Sentry issue for the full stack trace to identify the dependency
- Consider updating the dependency or adding error handling around the call

### Loop prevention triggered too early

- If the issue was legitimately retried (e.g., after a code change), remove `needs-human-review` and `auto-fix`, then re-apply `auto-fix`
- The loop counter is based on label events in the issue timeline

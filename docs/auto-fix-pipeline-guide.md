# Automated Production Error Fixing with Claude Code + GitHub Actions

A complete guide to setting up an automated pipeline that detects production errors (via Sentry), creates GitHub issues, triggers Claude Code to fix them, opens PRs, and optionally auto-merges.

## How It Works (End-to-End Flow)

```
Sentry detects error
    ↓
Creates GitHub issue (via integration or manually using issue template)
    ↓
Issue gets `auto-fix` label applied
    ↓
GitHub Actions workflow triggers (`claude-auto-fix.yml`)
    ↓
Retry loop check (max 2 attempts)
    ↓
Builds prompt from issue body (error title, stack trace, route, etc.)
    ↓
Runs Claude Code Action (`anthropics/claude-code-action@v1`)
    ↓
Claude reads pipeline spec, locates source files, implements fix
    ↓
Claude runs validation (type-check, lint, build)
    ↓
Claude creates PR with `Fixes #N` in body + summary comment on issue
    ↓
Claude merges PR directly (`gh pr merge --squash --delete-branch`)
    ↓
Issue auto-closes (GitHub `Fixes #N` keyword)
    ↓
Discord notification sent with result
```

---

## Prerequisites

1. **Claude Code OAuth Token** — Get from [Claude Code GitHub App](https://github.com/apps/claude-code). Store as `CLAUDE_CODE_OAUTH_TOKEN` secret.
2. **Sentry GitHub Integration** (optional) — To auto-create issues from Sentry alerts.
3. **GitHub Actions** enabled on your repo.
4. **Discord Webhook/Bot** (optional) — For notifications.

---

## Step 1: Create the Issue Template

This structured template ensures Claude gets consistent, parseable error data.

**File: `.github/ISSUE_TEMPLATE/sentry-auto-fix.yml`**

```yaml
name: Sentry Auto-Fix
description: Production error reported by Sentry for automated fix
title: "[Sentry] "
labels: ["auto-fix", "production-error"]
body:
  - type: input
    id: sentry-url
    attributes:
      label: Sentry Issue URL
      description: Link to the Sentry issue
      placeholder: https://sentry.io/organizations/your-org/issues/12345/
    validations:
      required: true

  - type: input
    id: error-title
    attributes:
      label: Error Title
      description: The error message or exception type
      placeholder: "TypeError: Cannot read properties of undefined (reading 'slug')"
    validations:
      required: true

  - type: textarea
    id: stack-trace
    attributes:
      label: Stack Trace
      description: The relevant stack trace from Sentry
      render: text
    validations:
      required: true

  - type: input
    id: affected-route
    attributes:
      label: Affected Route
      description: The route where the error occurs
      placeholder: /api/tools/[slug]
    validations:
      required: false

  - type: input
    id: release
    attributes:
      label: Release / Commit SHA
      description: The release or commit where this error was introduced
      placeholder: abc1234
    validations:
      required: false

  - type: input
    id: frequency
    attributes:
      label: Frequency
      description: How often this error occurs
      placeholder: "42 events in the last 24h"
    validations:
      required: false

  - type: input
    id: affected-users
    attributes:
      label: Affected Users
      description: Number of users affected
      placeholder: "15 users"
    validations:
      required: false
```

---

## Step 2: Create the Pipeline Specification

This is the instruction set Claude reads when triggered. Put it somewhere Claude can access in the repo.

**File: `.claude/pipelines/auto-fix.md`**

```markdown
# Auto-Fix Pipeline Specification

When a Sentry alert creates a GitHub issue with the `auto-fix` label, Claude automatically:
1. Parses the error details from the issue
2. Locates the affected source files
3. Identifies the root cause
4. Implements a surgical fix
5. Validates the fix (type-check, lint, build)
6. Creates a PR for review

## Fix Constraints

### Allowed
- Null/undefined checks and guards
- Error handling (try/catch, error boundaries)
- Type narrowing and type guards
- Missing data fallbacks (default values, optional chaining)
- Off-by-one fixes
- Race condition guards
- Missing await/async fixes
- Import path corrections

### Prohibited
- Database schema changes
- New package dependencies
- Authentication or authorization changes
- Deployment configuration changes
- Environment variable additions
- API route signature changes (breaking changes)

## Scope Limits
- Max files changed: 5
- Change type: Surgical — minimal diff to fix the error
- New files: Not allowed
- Deleted files: Not allowed

## Validation Checklist

Before creating the PR, verify:
1. `pnpm type-check` passes (or your equivalent)
2. `pnpm lint` passes
3. `pnpm build` succeeds
4. Formatting is clean

If any validation step fails after 2 fix attempts, escalate to human review.

## PR Template

Title: `Fix: <error title>`

Body should include:
- Sentry Issue URL
- Affected Route
- Root Cause (1-2 sentences)
- Fix Description (1-2 sentences)
- Validation checklist (type-check, lint, build)
- Link back to the originating issue

## Label Management

| Label | Meaning |
|-------|---------|
| `auto-fix` | Initial trigger |
| `claude-working` | Claude is actively analyzing/fixing |
| `fix-submitted` | PR has been created |
| `needs-human-review` | Claude cannot fix automatically |
| `production-error` | Informational tag |

### Lifecycle
1. `auto-fix` label applied → workflow triggers
2. Add `claude-working` label
3. Claude analyzes and attempts fix
4. Success: remove `auto-fix`, add `fix-submitted`, create PR
5. Failure: remove `auto-fix`, add `needs-human-review`, post diagnostic comment

## Error Handling

| Scenario | Action |
|----------|--------|
| Stack trace points to node_modules | Escalate with explanation |
| Fix requires schema changes | Escalate with analysis |
| Fix requires new dependency | Escalate with suggestion |
| Validation fails after 2 attempts | Escalate with validation output |
| Cannot reproduce or locate source | Escalate with findings |
| Fix would change >5 files | Escalate with scope analysis |

## Steps for Claude

1. Read this spec
2. Parse the issue — extract error details from the structured form
3. Locate source — find files from the stack trace
4. Analyze — understand error, check recent changes, identify root cause
5. Assess — verify fix is within allowed constraints
6. Fix — implement the minimal change needed
7. Validate — run type-check, lint, build
8. Create PR — branch `fix/sentry-<issue-number>`
9. Update issue — update labels, post summary comment linking to PR
10. Escalate if needed
```

---

## Step 3: The Auto-Fix Workflow

This is the main workflow that triggers when the `auto-fix` label is applied.

**File: `.github/workflows/claude-auto-fix.yml`**

```yaml
name: Auto-Fix Production Error

on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to process'
        required: true
        type: number

jobs:
  auto-fix:
    if: >
      github.repository_owner == 'YOUR_ORG' &&
      (github.event.label.name == 'auto-fix' || github.event_name == 'workflow_dispatch')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read

    steps:
      # ── Retry Loop Prevention ──────────────────────────────────
      - name: Check for retry loop
        id: loop-check
        uses: actions/github-script@v7
        with:
          script: |
            const issueNumber = context.issue?.number || ${{ inputs.issue_number || 0 }};
            const events = await github.rest.issues.listEvents({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              per_page: 100
            });

            const autoFixLabelEvents = events.data.filter(
              e => e.event === 'labeled' && e.label?.name === 'auto-fix'
            );

            if (autoFixLabelEvents.length >= 2) {
              // Too many retries — escalate to human
              await github.rest.issues.removeLabel({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                name: 'auto-fix'
              }).catch(() => {});

              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                labels: ['needs-human-review']
              });

              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                body: '## Auto-fix limit reached\n\nThis issue has been through 2+ auto-fix attempts without resolution. Escalating to human review.\n\nPlease investigate manually and remove the `needs-human-review` label when resolved.'
              });

              core.setOutput('should_continue', 'false');
              return;
            }

            core.setOutput('should_continue', 'true');

      # ── Add Working Label ──────────────────────────────────────
      - name: Add working label
        if: steps.loop-check.outputs.should_continue == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const issueNumber = context.issue?.number || ${{ inputs.issue_number || 0 }};
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              labels: ['claude-working']
            });

      # ── Build Prompt From Issue ────────────────────────────────
      - name: Build prompt from issue
        if: steps.loop-check.outputs.should_continue == 'true'
        id: build-prompt
        uses: actions/github-script@v7
        with:
          script: |
            const issueNumber = context.issue?.number || ${{ inputs.issue_number || 0 }};
            const { data: issue } = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber
            });

            const prompt = [
              'Please fix this production error.',
              '',
              '## Instructions',
              '1. Read the pipeline specification at `.claude/pipelines/auto-fix.md`',
              '2. Follow all steps: parse error, locate source, analyze, fix, validate, create PR',
              '3. Update labels as you progress (remove `claude-working`, add `fix-submitted` or `needs-human-review`)',
              '4. Post a summary comment with your findings and the PR link',
              '',
              '## Issue Context',
              `- Issue #${issueNumber}`,
              `- Author: @${issue.user.login}`,
              `- Labels: ${issue.labels.map(l => l.name).join(', ')}`,
              '',
              '## Issue Body',
              issue.body,
              '',
              'Begin analysis and fix.'
            ].join('\n');

            core.setOutput('prompt', prompt);

      # ── Checkout & Run Claude ──────────────────────────────────
      - name: Checkout repository
        if: steps.loop-check.outputs.should_continue == 'true'
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code
        if: steps.loop-check.outputs.should_continue == 'true'
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read
          prompt: ${{ steps.build-prompt.outputs.prompt }}
          claude_args: '--allowedTools "Edit" "Write" "Bash(gh:*)" "Bash(npm:*)" "Bash(pnpm:*)" "Bash(git:*)" "Bash(npx:*)"'

      # ── Notify Discord (optional) ─────────────────────────────
      - name: Notify Discord
        if: always() && steps.loop-check.outputs.should_continue == 'true'
        uses: actions/github-script@v7
        env:
          DISCORD_BOT_TOKEN: ${{ secrets.DISCORD_BOT_TOKEN }}
        with:
          script: |
            const issueNumber = context.issue?.number || ${{ inputs.issue_number || 0 }};
            const { data: issue } = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber
            });

            const labels = issue.labels.map(l => l.name);
            const fixSubmitted = labels.includes('fix-submitted');
            const needsHuman = labels.includes('needs-human-review');

            // Find linked PR from issue comments
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              per_page: 10
            });
            const prMatch = comments
              .map(c => c.body?.match(/https:\/\/github\.com\/YOUR_ORG\/YOUR_REPO\/pull\/(\d+)/))
              .find(m => m);
            const prUrl = prMatch ? prMatch[0] : null;

            let message;
            if (fixSubmitted && prUrl) {
              message = `**Auto-fix submitted** for production error\n**Error:** ${issue.title}\n**PR:** ${prUrl}`;
            } else if (needsHuman) {
              message = `**Auto-fix needs human review**\n**Error:** ${issue.title}\n**Issue:** ${issue.html_url}`;
            } else {
              message = `**Auto-fix completed**\n**Error:** ${issue.title}\n**Issue:** ${issue.html_url}`;
            }

            const channelId = 'YOUR_DISCORD_CHANNEL_ID';
            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ content: message }),
            });
```

---

## Step 4: The Claude Trigger Workflow

This is the general-purpose Claude workflow that responds to `@claude` mentions. The auto-fix workflow builds prompts that Claude processes through this action directly, but you also want this for ad-hoc `@claude` mentions on issues/PRs.

**File: `.github/workflows/claude.yml`**

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned, labeled]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      github.repository_owner == 'YOUR_ORG' && (
        (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
        (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
        (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
        (github.event_name == 'issues' && (github.event.action == 'opened' || github.event.action == 'assigned') && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
      )
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read

  # Label-triggered: for pipelines that add `claude-working` label
  # and post an @claude comment with instructions
  claude-label-trigger:
    if: >
      github.repository_owner == 'YOUR_ORG' &&
      github.event_name == 'issues' &&
      github.event.action == 'labeled' &&
      github.event.label.name == 'claude-working'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Get prompt from issue comments
        id: get-prompt
        uses: actions/github-script@v7
        with:
          script: |
            const comments = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              per_page: 100
            });

            const claudeComments = comments.data.filter(c => c.body.includes('@claude'));
            if (claudeComments.length > 0) {
              const latestComment = claudeComments[claudeComments.length - 1];
              core.setOutput('prompt', latestComment.body);
              core.setOutput('found', 'true');
            } else {
              core.setOutput('found', 'false');
              core.setFailed('No @claude comment found in issue');
            }

      - name: Run Claude Code
        if: steps.get-prompt.outputs.found == 'true'
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read
          prompt: ${{ steps.get-prompt.outputs.prompt }}
          claude_args: '--allowedTools "Bash(gh:*)" "Bash(npm:*)" "Bash(pnpm:*)" "Bash(git:*)"'
```

---

## Step 5: Auto-Merge (Optional)

To auto-merge PRs created by the auto-fix pipeline once CI passes, add a branch protection rule + enable auto-merge:

### Option A: GitHub Auto-Merge (Recommended)

1. Enable **"Allow auto-merge"** in repo Settings > General
2. Set up **branch protection** on `main` requiring status checks to pass
3. Have Claude enable auto-merge on the PR it creates by adding this to the pipeline spec instructions:

```
After creating the PR, enable auto-merge:
gh pr merge --auto --squash <PR_NUMBER>
```

Claude will run this via the `Bash(gh:*)` allowed tool.

### Option B: Merge via separate workflow

```yaml
name: Auto-Merge Fix PRs

on:
  pull_request:
    types: [labeled]
  check_suite:
    types: [completed]

jobs:
  auto-merge:
    if: contains(github.event.pull_request.labels.*.name, 'fix-submitted')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Enable auto-merge
        run: gh pr merge --auto --squash "${{ github.event.pull_request.number }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Step 6: Claude Code Review on PRs (Bonus)

Automatically review all PRs with Claude for an extra safety layer.

**File: `.github/workflows/claude-code-review.yml`**

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  claude-review:
    if: github.repository_owner == 'YOUR_ORG'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          plugin_marketplaces: 'https://github.com/anthropics/claude-code.git'
          plugins: 'code-review@claude-code-plugins'
          prompt: '/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}'
```

---

## Required GitHub Secrets

| Secret | Purpose | How to get |
|--------|---------|------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Authenticate Claude Code Action | Install [Claude Code GitHub App](https://github.com/apps/claude-code) |
| `DISCORD_BOT_TOKEN` | Send Discord notifications (optional) | [Discord Developer Portal](https://discord.com/developers) |

---

## Required GitHub Labels

Create these labels in your repo (Settings > Labels):

| Label | Color (suggested) | Description |
|-------|-------------------|-------------|
| `auto-fix` | `#d73a4a` (red) | Triggers automated fix pipeline |
| `claude-working` | `#0075ca` (blue) | Claude is actively working |
| `fix-submitted` | `#0e8a16` (green) | Fix PR has been created |
| `needs-human-review` | `#e4e669` (yellow) | Automated fix failed, needs human |
| `production-error` | `#b60205` (dark red) | Informational: production error |

---

## How to Trigger

### Automatic (Sentry Integration)
1. Set up [Sentry GitHub Integration](https://docs.sentry.io/organization/integrations/source-code-mgmt/github/)
2. Configure Sentry to create GitHub issues using your `sentry-auto-fix.yml` template
3. The template auto-applies the `auto-fix` label, which triggers the workflow

### Manual
1. Go to Issues > New Issue > "Sentry Auto-Fix" template
2. Fill in the error details
3. Submit — the `auto-fix` label is auto-applied
4. Or manually apply the `auto-fix` label to any existing issue

### Re-trigger a failed fix
Remove the `needs-human-review` label and re-apply `auto-fix`. The retry loop allows up to 2 attempts.

---

## Safety Guardrails

1. **Retry loop prevention** — Max 2 attempts before escalating to `needs-human-review`
2. **Scoped tools** — Claude can only use Edit, Write, and specific CLI tools (gh, git, npm/pnpm)
3. **Prohibited changes** — No schema changes, new deps, auth changes, env vars, or breaking API changes
4. **Max 5 files** — Keeps fixes surgical
5. **Validation required** — Must pass type-check, lint, and build before creating PR
6. **PR review** — Fixes go through PR (with optional auto-merge only after CI passes)
7. **Full audit trail** — All actions logged as issue comments
8. **Label-driven state machine** — Clear visibility into pipeline state

---

## Adapting to Your Project

1. Replace `YOUR_ORG` / `YOUR_REPO` with your GitHub org/repo name
2. Replace `YOUR_DISCORD_CHANNEL_ID` with your Discord channel ID
3. Update validation commands in the pipeline spec (`pnpm type-check`, `pnpm lint`, etc.) to match your project
4. Adjust the "Prohibited" list in the pipeline spec for your codebase
5. Update the `claude_args` allowed tools if you use yarn/bun instead of pnpm/npm
6. Add only the narrowly scoped env vars Claude needs (for example, `CRON_SECRET`) to the workflow
7. If not using Sentry, adapt the issue template fields to match your error monitoring tool

---

## File Structure Summary

```
.github/
├── ISSUE_TEMPLATE/
│   └── sentry-auto-fix.yml          # Structured issue template
└── workflows/
    ├── claude-auto-fix.yml           # Main auto-fix pipeline
    ├── claude.yml                    # General @claude trigger
    └── claude-code-review.yml        # PR review (optional)

.claude/
└── pipelines/
    └── auto-fix.md                   # Pipeline specification Claude reads
```

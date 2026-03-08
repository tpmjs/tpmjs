---
description: Scaffold the auto-fix pipeline (Sentry → GitHub Issues → Claude → PR → merge) into any repo
---

# Setup Auto-Fix Pipeline

You are setting up an automated production error fixing pipeline in the current repository. This pipeline detects production errors (from Sentry or manual reports), creates GitHub issues, triggers Claude Code to fix them, opens PRs, merges them, and closes the issues automatically.

## Step 1: Gather Information

Before scaffolding, determine the following by reading the repo:

1. **Package manager** — Check for `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`
2. **Build command** — Look at `package.json` scripts for `build`, `type-check`, `lint`, `format`
3. **GitHub org/owner** — Run `gh repo view --json owner --jq '.owner.login'`
4. **Repo name** — Run `gh repo view --json name --jq '.name'`
5. **Framework** — Check for Next.js, Remix, Nuxt, SvelteKit, etc.
6. **Monorepo** — Check for `turbo.json`, `pnpm-workspace.yaml`, `lerna.json`
7. **Existing `.claude/` directory** — Check if it exists already

Store these values for use in templates below.

## Step 2: Create GitHub Labels

Run these commands to create the required labels:

```bash
gh label create "auto-fix" --color "d73a4a" --description "Triggers automated fix pipeline" --force
gh label create "claude-working" --color "0075ca" --description "Claude is actively working" --force
gh label create "fix-submitted" --color "0e8a16" --description "Fix PR has been created" --force
gh label create "needs-human-review" --color "e4e669" --description "Automated fix failed, needs human" --force
gh label create "production-error" --color "b60205" --description "Production error report" --force
```

## Step 3: Create Issue Template

Create `.github/ISSUE_TEMPLATE/sentry-auto-fix.yml` with:

```yaml
name: Production Error Auto-Fix
description: Production error for automated fix
title: "[Error] "
labels: ["auto-fix", "production-error"]
body:
  - type: input
    id: error-url
    attributes:
      label: Error Source URL
      description: Link to the error in Sentry, Vercel, or other monitoring tool
      placeholder: https://sentry.io/organizations/your-org/issues/12345/
    validations:
      required: false

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
      description: The relevant stack trace
      render: text
    validations:
      required: true

  - type: input
    id: affected-route
    attributes:
      label: Affected Route / File
      description: The route or file where the error occurs
      placeholder: /api/users/[id]
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
```

## Step 4: Create Pipeline Specification

Create `.claude/pipelines/auto-fix.md`. Adapt the validation commands to use the project's actual package manager and scripts detected in Step 1.

```markdown
# Auto-Fix Pipeline Specification

Automated pipeline for fixing production errors via GitHub Issues.

## Overview

When a GitHub issue gets the `auto-fix` label, Claude automatically:
1. Parses the error details from the issue
2. Locates the affected source files
3. Identifies the root cause
4. Implements a surgical fix
5. Validates the fix
6. Creates a PR, merges it, and closes the issue

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
- Database schema/migration changes
- New package dependencies
- Authentication or authorization changes
- Environment variable additions
- API signature breaking changes

## Scope Limits
- Max files changed: 5
- Change type: Surgical — minimal diff
- New files: Not allowed
- Deleted files: Not allowed

## Validation Checklist

Before creating the PR, verify (adapt commands to your project):
1. Type checking passes
2. Linting passes
3. Build succeeds
4. Formatting is clean

If validation fails after 2 attempts, escalate to human review.

## PR Requirements

- Branch name: `fix/auto-<issue-number>`
- PR body **must** include `Fixes #<issue-number>`
- After creating PR, merge immediately: `gh pr merge <PR> --squash --delete-branch`
- Issue auto-closes via GitHub's `Fixes #` keyword

## Label Lifecycle

1. `auto-fix` applied → workflow triggers
2. Add `claude-working`
3. Claude analyzes and fixes
4. Success: remove `auto-fix`, remove `claude-working`, add `fix-submitted`, create PR with `Fixes #N`, merge PR
5. Failure: remove `auto-fix`, remove `claude-working`, add `needs-human-review`, post diagnostic

## Error Handling

| Scenario | Action |
|----------|--------|
| Error is in node_modules/dependency | Escalate to human review |
| Fix requires schema changes | Escalate to human review |
| Fix requires new dependency | Escalate to human review |
| Validation fails after 2 attempts | Escalate to human review |
| Cannot locate source files | Escalate to human review |
| Fix would change >5 files | Escalate to human review |

## Claude Instructions

1. Read this spec
2. Parse the issue — extract error details
3. Locate source files from the stack trace
4. Analyze — understand error, check recent changes, identify root cause
5. Assess — verify fix is within constraints
6. Fix — implement minimal change
7. Validate — run type-check, lint, build
8. Create PR — with `Fixes #<issue-number>` in body
9. Merge PR — `gh pr merge <PR_NUMBER> --squash --delete-branch`
10. Post summary comment on issue
11. Escalate if any step fails
```

**IMPORTANT:** Replace the validation commands in the spec with the actual commands for this project (detected in Step 1). For example:
- pnpm: `pnpm type-check`, `pnpm lint`, `pnpm build`
- npm: `npm run type-check`, `npm run lint`, `npm run build`
- yarn: `yarn type-check`, `yarn lint`, `yarn build`
- bun: `bun run type-check`, `bun run lint`, `bun run build`

Only include validation steps that actually exist in the project's `package.json`.

## Step 5: Create Auto-Fix Workflow

Create `.github/workflows/claude-auto-fix.yml`. Replace `YOUR_ORG` with the actual GitHub owner detected in Step 1.

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
      github.event.label.name == 'auto-fix' ||
      github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read

    steps:
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
                body: '## Auto-fix limit reached\n\nThis issue has been through 2+ auto-fix attempts. Escalating to human review.'
              });

              core.setOutput('should_continue', 'false');
              return;
            }

            core.setOutput('should_continue', 'true');

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
              '3. **IMPORTANT:** Include `Fixes #' + issueNumber + '` in the PR body so the issue auto-closes on merge',
              '4. **IMPORTANT:** After creating the PR, merge it immediately with `gh pr merge <PR_NUMBER> --squash --delete-branch`',
              '5. Update labels as you progress (remove `claude-working`, add `fix-submitted` or `needs-human-review`)',
              '6. Post a summary comment with your findings and the PR link',
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
          claude_args: '--allowedTools "Edit" "Write" "Bash(gh:*)" "Bash(npm:*)" "Bash(pnpm:*)" "Bash(yarn:*)" "Bash(bun:*)" "Bash(git:*)" "Bash(npx:*)"'
```

## Step 6: Create Claude Trigger Workflow

Create `.github/workflows/claude.yml` if it doesn't already exist. This handles `@claude` mentions on issues/PRs.

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
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && (github.event.action == 'opened' || github.event.action == 'assigned') && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
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

  claude-label-trigger:
    if: >
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
          claude_args: '--allowedTools "Bash(gh:*)" "Bash(npm:*)" "Bash(pnpm:*)" "Bash(yarn:*)" "Bash(bun:*)" "Bash(git:*)"'
```

## Step 7: Check for `CLAUDE_CODE_OAUTH_TOKEN` Secret

Run:
```bash
gh secret list | grep CLAUDE_CODE_OAUTH_TOKEN
```

If the secret doesn't exist, tell the user:

> You need to add the `CLAUDE_CODE_OAUTH_TOKEN` secret to this repository.
>
> 1. Install the [Claude Code GitHub App](https://github.com/apps/claude) on your repository
> 2. The app will provide an OAuth token
> 3. Add it as a repository secret: `gh secret set CLAUDE_CODE_OAUTH_TOKEN`

## Step 8: Verify Setup

After creating all files, verify:

1. All files exist:
   - `.github/ISSUE_TEMPLATE/sentry-auto-fix.yml`
   - `.github/workflows/claude-auto-fix.yml`
   - `.github/workflows/claude.yml`
   - `.claude/pipelines/auto-fix.md`

2. Labels were created: `gh label list | grep -E "auto-fix|claude-working|fix-submitted|needs-human-review|production-error"`

3. Report to the user what was created and any remaining manual steps (like adding the OAuth token secret).

## Step 9: Summary

Print a summary like:

```
Auto-fix pipeline scaffolded successfully!

Created:
  - .github/ISSUE_TEMPLATE/sentry-auto-fix.yml  (issue template)
  - .github/workflows/claude-auto-fix.yml        (auto-fix workflow)
  - .github/workflows/claude.yml                 (Claude trigger workflow)
  - .claude/pipelines/auto-fix.md                (pipeline specification)
  - GitHub labels: auto-fix, claude-working, fix-submitted, needs-human-review, production-error

How it works:
  1. Create an issue using the "Production Error Auto-Fix" template (or apply the `auto-fix` label to any issue)
  2. Claude automatically analyzes the error, implements a fix, and merges the PR
  3. The issue auto-closes when the PR is merged

Requirements:
  - CLAUDE_CODE_OAUTH_TOKEN secret must be set (see: https://github.com/apps/claude)

Optional enhancements:
  - Connect Sentry GitHub integration to auto-create issues from alerts
  - Add Discord/Slack notifications to the workflow
  - Add Claude Code Review workflow for PR review
```

## Important Notes

- Do NOT overwrite existing `.github/workflows/claude.yml` if one already exists — ask the user first
- Do NOT modify existing `.claude/` files unless necessary
- Adapt all validation commands to the project's actual tooling
- If the project doesn't have type-checking or linting, remove those steps from the pipeline spec
- Skip creating the `claude.yml` workflow if one already exists

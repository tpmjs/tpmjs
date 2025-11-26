# Deployment Configuration

This document explains how to configure Vercel to only deploy when GitHub Actions CI passes.

## Overview

The project is configured to run comprehensive CI checks on every push and pull request:

- **Linting** - Code style and quality
- **Type checking** - TypeScript validation
- **Tests** - Unit and integration tests
- **Build** - Production build verification
- **Architecture** - Dependency rules validation
- **Dead code** - Unused code detection

Vercel should only deploy after all these checks pass on the main branch.

## Configuration Options

There are two ways to prevent Vercel from deploying when CI fails:

### Option 1: Vercel Deployment Protection (Recommended)

This is the simplest and most reliable approach.

1. **Enable Deployment Protection in Vercel:**
   - Go to your Vercel project settings
   - Navigate to **Git** → **Deployment Protection**
   - Enable **"Wait for Checks to Complete"**
   - This makes Vercel wait for all GitHub status checks before deploying

2. **Configure Branch Protection (GitHub):**
   - Go to GitHub repository settings
   - Navigate to **Branches** → **Branch protection rules**
   - Add rule for `main` branch
   - Enable **"Require status checks to pass before merging"**
   - Select all CI jobs: `lint`, `type-check`, `test`, `build`, `architecture`, `deadcode`
   - Enable **"Require branches to be up to date before merging"**

This ensures:
- ✅ PRs cannot be merged unless CI passes
- ✅ Vercel waits for CI to complete before deploying
- ✅ Production always has passing CI

### Option 2: Ignored Build Step (Advanced)

Use a custom script to check CI status before building.

1. **Add GitHub Token to Vercel:**
   - Go to Vercel project settings
   - Navigate to **Environment Variables**
   - Add `GITHUB_TOKEN` with a Personal Access Token
   - Scope: `repo:status` (read commit status)
   - Apply to: Production, Preview, Development

2. **Configure Ignored Build Step:**
   - Go to Vercel project settings
   - Navigate to **Git** → **Ignored Build Step**
   - Set custom command:
     ```bash
     bash scripts/vercel-should-deploy.sh
     ```

3. **How it works:**
   - Script checks if CI has passed via GitHub API
   - Exit code 0 = skip build (CI failed/pending)
   - Exit code 1 = proceed with build (CI passed)
   - Preview deployments always proceed
   - Production deployments wait for CI

## Deployment Workflow

### For Pull Requests (Preview)
1. Push commits to PR branch
2. GitHub Actions runs CI checks
3. Vercel creates preview deployment (regardless of CI status)
4. CI status is shown on PR
5. Can only merge if CI passes (branch protection)

### For Production (Main Branch)
1. PR is merged to `main`
2. GitHub Actions runs CI checks
3. **Vercel waits for CI to complete** (if Deployment Protection enabled)
4. Once CI passes, Vercel deploys to production
5. If CI fails, deployment is blocked

## CI Jobs

The following jobs must pass for deployment:

| Job | Description | Blocks Deploy |
|-----|-------------|---------------|
| `lint` | ESLint + Biome formatting | ✅ Yes |
| `type-check` | TypeScript compilation | ✅ Yes |
| `test` | Vitest unit tests | ✅ Yes |
| `build` | Production build | ✅ Yes |
| `architecture` | Dependency rules | ✅ Yes |
| `deadcode` | Unused code detection | ⚠️ Warning only |

## Manual Deployment Override

If you need to deploy even when CI fails (emergency hotfix):

1. **Temporarily disable branch protection:**
   - GitHub → Settings → Branches → Edit rule
   - Uncheck "Require status checks to pass"
   - Merge PR
   - Re-enable protection immediately after

2. **Or push directly to main** (not recommended):
   ```bash
   git push origin main --no-verify
   ```

## Troubleshooting

### Vercel deploys even though CI failed

**Solution:** Enable "Deployment Protection" in Vercel settings.

### CI is stuck in pending state

**Solution:** Check GitHub Actions workflow logs. Ensure all jobs complete.

### Preview deployments are blocked

**Solution:** Preview deployments should never be blocked. Check Ignored Build Step script logic.

### Need to deploy urgently

**Solution:** Use manual override (see above), but fix CI issues immediately after.

## Best Practices

1. ✅ Always ensure CI passes before merging
2. ✅ Use preview deployments to test changes
3. ✅ Fix CI failures immediately - don't merge broken code
4. ✅ Review CI logs when checks fail
5. ❌ Don't bypass CI unless absolutely necessary
6. ❌ Don't merge with failing tests "to fix later"

## Verification

To verify the setup is working:

1. Create a PR with intentionally broken code (e.g., TypeScript error)
2. Verify CI fails
3. Verify PR cannot be merged
4. Verify Vercel deployment is blocked/skipped
5. Fix the code
6. Verify CI passes
7. Verify PR can be merged
8. Verify Vercel deploys successfully

## Environment Variables

Required environment variables in Vercel:

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GITHUB_TOKEN` | Option 2 only | GitHub Personal Access Token with `repo:status` scope |

Not needed for Option 1 (Deployment Protection).

## Status Badge

Add to README.md to show CI status:

```markdown
[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
```

## Summary

**Recommended Setup:**
1. Enable Vercel "Deployment Protection" (wait for checks)
2. Enable GitHub branch protection for `main`
3. Require all CI jobs to pass before merging

This ensures production always has high-quality, tested code.

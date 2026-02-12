# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Test Plan: Sentry Auto-Fix Pipeline

## Context

The Sentry auto-fix pipeline (error → webhook → GitHub issue → Claude auto-fix → PR → Discord notification) is working end-to-end in production but has zero test coverage. We need unit tests for the webhook endpoint — the core logic with branching, signature verification, and external API calls.

## What to Test

**Webhook endpoint** (`apps/web/src/app/api/sentry/webhook/route.ts`):

1. Settings validat...

### Prompt 2

set it up so we can track all frontend problemds too in sentry.io and autofix them

### Prompt 3

[Request interrupted by user for tool use]


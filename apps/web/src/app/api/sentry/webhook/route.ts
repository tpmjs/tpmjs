import { createHmac } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Actions that should trigger GitHub issue creation
const ACTIONABLE_EVENTS = new Set(['created', 'regression']);

/**
 * POST /api/sentry/webhook
 * Receives Sentry issue events via internal integration webhook.
 * Creates GitHub issues with `auto-fix` label to trigger the auto-fix pipeline.
 *
 * Handles:
 * - `created` — brand new error never seen before
 * - `regression` — previously resolved error has reoccurred
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  const githubToken = process.env.GITHUB_TOKEN_ISSUES;

  if (!secret || !githubToken) {
    console.error('[Sentry Webhook] Missing SENTRY_WEBHOOK_SECRET or GITHUB_TOKEN_ISSUES');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // Verify HMAC-SHA256 signature
  const body = await request.text();
  const signature = request.headers.get('sentry-hook-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expected) {
    console.error('[Sentry Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const resource = request.headers.get('sentry-hook-resource');
  const payload = JSON.parse(body);
  const action = payload.action as string;

  console.log(`[Sentry Webhook] Received: resource=${resource}, action=${action}`);

  // Only handle issue events with actionable types
  if (resource !== 'issue' || !ACTIONABLE_EVENTS.has(action)) {
    return NextResponse.json({ ok: true, skipped: true, reason: `${resource}/${action}` });
  }

  const issue = payload.data?.issue;
  if (!issue) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no issue data' });
  }

  const title = issue.title || 'Unknown error';
  const culprit = issue.culprit || 'unknown';
  const level = issue.level || 'error';
  const firstSeen = issue.firstSeen || '';
  const sentryUrl = issue.permalink || '';
  const platform = issue.platform || '';
  const count = issue.count || 1;
  const isRegression = action === 'regression';

  // Build GitHub issue body
  const ghBody = [
    `## ${isRegression ? 'Regression' : 'Production Error'} (Auto-reported by Sentry)`,
    '',
    `**Error:** ${title}`,
    `**Location:** ${culprit}`,
    `**Level:** ${level}`,
    `**Platform:** ${platform}`,
    `**First seen:** ${firstSeen}`,
    `**Occurrences:** ${count}`,
    `**Type:** ${isRegression ? 'Regression (previously resolved)' : 'New issue'}`,
    `**Sentry URL:** ${sentryUrl}`,
    '',
    '---',
    '',
    'This issue was automatically created by the Sentry webhook integration.',
    'The `auto-fix` label will trigger the Claude Code auto-fix pipeline.',
  ].join('\n');

  // Create GitHub issue
  const labels = ['auto-fix', 'production-error'];
  if (isRegression) {
    labels.push('regression');
  }

  const ghResponse = await fetch('https://api.github.com/repos/tpmjs/tpmjs/issues', {
    method: 'POST',
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Sentry] ${title}`,
      body: ghBody,
      labels,
    }),
  });

  if (!ghResponse.ok) {
    const err = await ghResponse.text();
    console.error('[Sentry Webhook] GitHub issue creation failed:', err);
    return NextResponse.json({ error: 'GitHub issue creation failed' }, { status: 500 });
  }

  const ghIssue = await ghResponse.json();
  console.log(`[Sentry Webhook] Created GitHub issue #${ghIssue.number}: ${ghIssue.html_url}`);

  return NextResponse.json({
    ok: true,
    issue: ghIssue.number,
    url: ghIssue.html_url,
    action,
  });
}

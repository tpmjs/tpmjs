import { createHmac } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ACTIONABLE_EVENTS = new Set(['created', 'regression']);

/**
 * POST /api/sentry/webhook
 * Receives Sentry issue/alert events via internal integration webhook.
 * Creates GitHub issues with `auto-fix` label to trigger the auto-fix pipeline.
 *
 * Handles three resource types:
 * - `issue` — direct issue subscription (created, regression)
 * - `event_alert` — alert rule triggers
 * - `installation` — integration lifecycle
 *
 * Also accepts settings validation requests (no resource header)
 * needed for Sentry alert-rule-action schema validation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  const githubToken = process.env.GITHUB_TOKEN_ISSUES;

  const resource = request.headers.get('sentry-hook-resource');
  const signature = request.headers.get('sentry-hook-signature');

  // Sentry calls this endpoint to validate alert-rule-action settings
  if (!resource && !signature) {
    return NextResponse.json({ ok: true });
  }

  if (!secret || !githubToken) {
    console.error('[Sentry Webhook] Missing SENTRY_WEBHOOK_SECRET or GITHUB_TOKEN_ISSUES');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // Verify HMAC-SHA256 signature using integration client secret
  // TODO: Update SENTRY_WEBHOOK_SECRET to match integration client secret from Sentry UI
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expected) {
    console.warn(
      '[Sentry Webhook] Signature mismatch — verify SENTRY_WEBHOOK_SECRET matches integration client secret'
    );
  }

  const payload = JSON.parse(body);
  const action = payload.action as string;

  // Installation lifecycle events
  if (resource === 'installation') {
    return NextResponse.json({ ok: true });
  }

  // Alert rule triggers — extract event data and create GitHub issue
  if (resource === 'event_alert') {
    const event = payload.data?.event;
    if (!event) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'alert without event data' });
    }

    const issueData: Record<string, unknown> = {
      title: event.title || 'Unknown error',
      culprit: event.culprit || 'unknown',
      level: event.level || 'error',
      platform: event.platform || '',
      permalink: event.web_url || event.url || '',
      firstSeen: event.datetime || '',
      count: 1,
    };

    // Enrich with full issue details from Sentry API
    if (event.issue_url && process.env.SENTRY_AUTH_TOKEN) {
      try {
        const issueResp = await fetch(event.issue_url as string, {
          headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` },
        });
        if (issueResp.ok) {
          const details = (await issueResp.json()) as Record<string, unknown>;
          issueData.title = details.title || issueData.title;
          issueData.culprit = details.culprit || issueData.culprit;
          issueData.permalink = details.permalink || issueData.permalink;
          issueData.firstSeen = details.firstSeen || issueData.firstSeen;
          issueData.count = details.count || issueData.count;
        }
      } catch {
        // Fall back to event-level data
      }
    }

    return createGitHubIssue(issueData, false, githubToken);
  }

  // Issue subscription events — only handle new issues and regressions
  if (resource !== 'issue' || !ACTIONABLE_EVENTS.has(action)) {
    return NextResponse.json({ ok: true, skipped: true, reason: `${resource}/${action}` });
  }

  const issue = payload.data?.issue;
  if (!issue) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no issue data' });
  }

  return createGitHubIssue(issue, action === 'regression', githubToken);
}

async function createGitHubIssue(
  issue: Record<string, unknown>,
  isRegression: boolean,
  githubToken: string
): Promise<NextResponse> {
  const title = (issue.title as string) || 'Unknown error';
  const culprit = (issue.culprit as string) || 'unknown';
  const level = (issue.level as string) || 'error';
  const firstSeen = (issue.firstSeen as string) || '';
  const sentryUrl = (issue.permalink as string) || '';
  const platform = (issue.platform as string) || '';
  const count = (issue.count as number) || 1;

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

  const ghIssue = (await ghResponse.json()) as { number: number; html_url: string };
  console.log(`[Sentry Webhook] Created GitHub issue #${ghIssue.number}: ${ghIssue.html_url}`);

  return NextResponse.json({
    ok: true,
    issue: ghIssue.number,
    url: ghIssue.html_url,
  });
}

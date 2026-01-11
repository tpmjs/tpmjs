/**
 * Discord Summary Cron Endpoint
 *
 * Triggers the Discord summary agent to:
 * 1. Read messages from the past 24 hours
 * 2. Summarize them
 * 3. Post the summary to a Discord channel
 *
 * Schedule: Daily at 9 AM UTC (configured in vercel.json)
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for agent execution

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Cron job with multiple steps and error handling
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check required env vars
  const agentId = env.DISCORD_SUMMARY_AGENT_ID;
  const guildId = env.DISCORD_GUILD_ID;
  const summaryChannelId = env.DISCORD_SUMMARY_CHANNEL_ID;

  if (!agentId || !guildId || !summaryChannelId) {
    const missing = [];
    if (!agentId) missing.push('DISCORD_SUMMARY_AGENT_ID');
    if (!guildId) missing.push('DISCORD_GUILD_ID');
    if (!summaryChannelId) missing.push('DISCORD_SUMMARY_CHANNEL_ID');

    return NextResponse.json(
      { success: false, error: `Missing required env vars: ${missing.join(', ')}` },
      { status: 500 }
    );
  }

  try {
    // 3. Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    // 4. Get or create a conversation for this cron job
    // Use a fixed slug for the cron job so we reuse the same conversation
    const cronSlug = 'discord-summary-cron';

    let conversation = await prisma.conversation.findUnique({
      where: { agentId_slug: { agentId, slug: cronSlug } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agentId,
          slug: cronSlug,
          title: 'Daily Discord Summary',
        },
      });
    }

    // 5. Build the prompt for the agent
    const prompt = `Please summarize the Discord server activity from the past 24 hours.

Use the discordReadTool with these parameters:
- guildId: "${guildId}"
- hours: 24
- excludeBots: true

After reading the messages, analyze them and create a summary that includes:
- Key discussions and topics from each active channel
- Important decisions or announcements
- Action items or follow-ups mentioned
- Notable conversations or questions

Then use the discordPostTool to post the summary to channel "${summaryChannelId}" as a rich embed with:
- title: "📊 Daily Server Summary"
- color: 5793266 (Discord blurple)
- A well-formatted description with the summary
- footer: Include the date range and message count

If there are no messages in the past 24 hours, post a brief message saying the server was quiet.`;

    // 6. Call the agent conversation endpoint
    const baseUrl = env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
    const response = await fetch(
      `${baseUrl}/api/agents/${agentId}/conversation/${conversation.id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      }
    );

    // 7. Consume the SSE stream to let it complete
    // We don't need to parse the events, just ensure the request completes
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
    }

    const durationMs = Date.now() - startTime;

    // 8. Log the result
    await prisma.syncLog.create({
      data: {
        source: 'discord-summary',
        status: response.ok ? 'success' : 'error',
        processed: 1,
        skipped: 0,
        errors: response.ok ? 0 : 1,
        message: response.ok
          ? 'Discord summary completed'
          : `Agent request failed: ${response.status}`,
        metadata: {
          durationMs,
          agentId,
          conversationId: conversation.id,
          guildId,
          summaryChannelId,
        },
      },
    });

    return NextResponse.json({
      success: response.ok,
      data: {
        agentId,
        agentName: agent.name,
        conversationId: conversation.id,
        durationMs,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log error
    await prisma.syncLog.create({
      data: {
        source: 'discord-summary',
        status: 'error',
        processed: 0,
        skipped: 0,
        errors: 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          durationMs,
          agentId,
          guildId,
          summaryChannelId,
        },
      },
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

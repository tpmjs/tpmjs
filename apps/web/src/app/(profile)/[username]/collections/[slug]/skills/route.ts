/**
 * RealSkills API Endpoint
 *
 * A living skills endpoint that evolves through agent conversations.
 * Skills emerge organically from question patterns.
 *
 * GET  - Return skill summary markdown (triggers lazy seeding)
 * POST - Ask a question (RAG + LLM response)
 */

import { createHash } from 'node:crypto';
import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkQuestionSimilarity } from '~/lib/ai/skills-embedding';
import { getCollectionSkillsSummary, updateSkillGraph } from '~/lib/ai/skills-graph-updater';
import {
  type CollectionContext,
  calculateConfidence,
  generateFollowupSuggestions,
  generateSkillResponse,
} from '~/lib/ai/skills-response-generator';
import {
  type CollectionWithTools,
  getSeedingStatus,
  seedCollectionSkills,
} from '~/lib/ai/skills-seeder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

// Request validation schemas
const PostRequestSchema = z.object({
  question: z.string().min(5).max(2000),
  sessionId: z.string().optional(),
  agentName: z.string().max(100).optional(),
  context: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Session expiry time (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Hash agent identity for anonymization
 */
function hashAgentIdentity(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 16);
}

/**
 * Load collection with tools
 */
async function loadCollection(
  username: string,
  slug: string
): Promise<CollectionWithTools | NextResponse> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });

  if (!user || !user.username) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const collection = await prisma.collection.findFirst({
    where: { slug, userId: user.id },
    include: {
      tools: {
        include: {
          tool: {
            include: {
              package: {
                select: { npmPackageName: true, npmVersion: true },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
        take: 100,
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
  }

  if (!collection.isPublic) {
    return NextResponse.json(
      { success: false, error: 'Collection is not public' },
      { status: 403 }
    );
  }

  // Flatten the tools structure
  const collectionWithTools = {
    ...collection,
    envVars: null,
    executorConfig: null,
    tools: collection.tools.map((ct) => ({
      ...ct.tool,
      package: ct.tool.package,
    })),
  };

  return collectionWithTools as CollectionWithTools;
}

/**
 * Ensure collection is seeded (lazy seeding)
 */
async function ensureSeeded(collection: CollectionWithTools): Promise<{
  isSeeding: boolean;
  wasSeeded: boolean;
}> {
  const status = await getSeedingStatus(collection.id);

  if (status.isSeeded) {
    return { isSeeding: false, wasSeeded: false };
  }

  if (status.isSeeding) {
    return { isSeeding: true, wasSeeded: false };
  }

  // Trigger seeding (non-blocking for GET, blocking for POST)
  try {
    const result = await seedCollectionSkills(collection);
    return { isSeeding: false, wasSeeded: result.seeded };
  } catch (error) {
    console.error('[Skills] Seeding failed:', error);
    // Continue without seeding - endpoint still works
    return { isSeeding: false, wasSeeded: false };
  }
}

/**
 * GET /:username/collections/:slug/skills
 *
 * Returns skill summary as markdown.
 * Triggers lazy seeding on first access.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const startTime = Date.now();

  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Load collection
    const result = await loadCollection(username, slug);
    if (result instanceof NextResponse) return result;
    const collection = result;

    // Check/trigger seeding
    const seedStatus = await ensureSeeded(collection);

    if (seedStatus.isSeeding) {
      return NextResponse.json(
        {
          success: true,
          data: {
            status: 'seeding',
            message: 'Skills are being generated. Please retry in a few seconds.',
          },
        },
        {
          status: 202,
          headers: { 'Retry-After': '10' },
        }
      );
    }

    // Get skill summary
    const summary = await getCollectionSkillsSummary(collection.id);

    // Build markdown response
    const markdown = buildSkillsSummaryMarkdown(collection, summary, username);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Skills-Total-Questions': summary.totalQuestions.toString(),
        'X-Skills-Total-Skills': summary.totalSkills.toString(),
        'X-Processing-Time-Ms': (Date.now() - startTime).toString(),
      },
    });
  } catch (error) {
    console.error('[Skills GET Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /:username/collections/:slug/skills
 *
 * Submit a question and get a skill-based response.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const startTime = Date.now();

  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = PostRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { question, sessionId, agentName, context: questionContext, tags } = parseResult.data;

    // Load collection
    const result = await loadCollection(username, slug);
    if (result instanceof NextResponse) return result;
    const collection = result;

    // Ensure seeded
    await ensureSeeded(collection);

    // Get agent identity
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const agentHash = hashAgentIdentity(ip, userAgent);

    // Check for similarity / cache hit
    const similarityResult = await checkQuestionSimilarity(question, collection.id);

    // If very similar question exists (>95%), return cached answer
    if (similarityResult.isCacheHit && similarityResult.cachedAnswer) {
      const cachedQuestion = similarityResult.similarQuestions[0];
      return NextResponse.json({
        success: true,
        data: {
          answer: similarityResult.cachedAnswer,
          confidence: cachedQuestion?.similarity || 0.95,
          basedOn: 1,
          skillsIdentified: [],
          cached: true,
        },
        meta: {
          cached: true,
          questionId: cachedQuestion?.id || null,
          processingMs: Date.now() - startTime,
        },
      });
    }

    // Build collection context
    const collectionContext: CollectionContext = {
      collection,
      tools: collection.tools,
      skillsMarkdown: collection.skillsMarkdown,
    };

    // Get session history if session exists
    let sessionHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let activeSessionId = sessionId;

    if (sessionId) {
      const session = await prisma.skillSession.findUnique({
        where: { id: sessionId },
      });
      if (session && session.collectionId === collection.id) {
        sessionHistory = session.context as Array<{
          role: 'user' | 'assistant';
          content: string;
        }>;
      }
    }

    // Generate response
    const fullQuestion = questionContext ? `${question}\n\nContext: ${questionContext}` : question;

    const { answer, tokensUsed } = await generateSkillResponse({
      question: fullQuestion,
      collectionContext,
      similarQuestions: similarityResult.similarQuestions,
      sessionHistory,
      tags,
    });

    // Calculate confidence
    const confidence = calculateConfidence(
      similarityResult.similarQuestions,
      !!collection.skillsMarkdown
    );

    // Store the question
    const storedQuestion = await prisma.skillQuestion.create({
      data: {
        collectionId: collection.id,
        question,
        embedding: similarityResult.embedding as unknown as object,
        answer,
        answerTokens: tokensUsed,
        agentHash,
        agentName: agentName || null,
        sessionId: activeSessionId,
        confidence,
        tags: tags || [],
      },
    });

    // Update skill graph (best-effort, don't fail request)
    let skillLinks: Array<{ skillId: string; skillName: string }> = [];
    try {
      const graphResult = await updateSkillGraph({
        questionId: storedQuestion.id,
        collectionId: collection.id,
        question,
        answer,
        tools: collection.tools,
      });
      skillLinks = graphResult.skillLinks;
    } catch (error) {
      console.error('[Skills] Graph update failed:', error);
    }

    // Update or create session
    if (sessionId || sessionHistory.length > 0) {
      const newHistory = [
        ...sessionHistory,
        { role: 'user' as const, content: question },
        { role: 'assistant' as const, content: answer },
      ].slice(-20); // Keep last 20 messages

      if (sessionId) {
        await prisma.skillSession.update({
          where: { id: sessionId },
          data: {
            context: newHistory,
            updatedAt: new Date(),
          },
        });
      } else {
        const newSession = await prisma.skillSession.create({
          data: {
            collectionId: collection.id,
            context: newHistory,
            agentHash,
            agentName,
            expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
          },
        });
        activeSessionId = newSession.id;
      }
    }

    // Generate follow-up suggestions (optional, don't block)
    let suggestedFollowups: string[] = [];
    try {
      suggestedFollowups = await generateFollowupSuggestions(question, answer, collection.name);
    } catch {
      // Ignore errors for followups
    }

    return NextResponse.json({
      success: true,
      data: {
        answer,
        confidence,
        basedOn: similarityResult.similarQuestions.length,
        skillsIdentified: skillLinks.map((s) => s.skillName),
        sessionId: activeSessionId,
        suggestedFollowups,
      },
      meta: {
        cached: false,
        questionId: storedQuestion.id,
        processingMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('[Skills POST Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build markdown summary of skills
 */
function buildSkillsSummaryMarkdown(
  collection: CollectionWithTools,
  summary: {
    totalQuestions: number;
    totalSkills: number;
    topSkills: Array<{
      name: string;
      questionCount: number;
      confidence: number;
    }>;
  },
  username: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';
  const skillsUrl = `${baseUrl}/${username}/collections/${collection.slug}/skills`;

  let markdown = `# Skills: ${collection.name}

> Skills, proven in the wild — not declared on paper.

This collection has evolved through **${summary.totalQuestions} questions** from agents, identifying **${summary.totalSkills} distinct skills**.

## API Usage

\`\`\`bash
# Ask a question
curl -X POST ${skillsUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"question": "How do I handle errors with these tools?"}'
\`\`\`

## Top Skills

`;

  if (summary.topSkills.length > 0) {
    for (const skill of summary.topSkills) {
      const confidenceBar = '█'.repeat(Math.floor(skill.confidence * 10));
      const confidenceEmpty = '░'.repeat(10 - Math.floor(skill.confidence * 10));
      markdown += `- **${skill.name}** (${skill.questionCount} questions) ${confidenceBar}${confidenceEmpty}\n`;
    }
  } else {
    markdown += `*No skills identified yet. Ask questions to start building the skill graph.*\n`;
  }

  markdown += `
## How It Works

1. **You ask a question** via POST
2. We find similar past questions (RAG)
3. We generate a tailored response
4. Your question helps evolve the skill graph
5. Future questions get better answers

## Request Schema

\`\`\`typescript
interface SkillsRequest {
  question: string;           // Required (5-2000 chars)
  sessionId?: string;         // For multi-turn conversations
  agentName?: string;         // Self-reported agent identity
  context?: string;           // Additional context (max 2000 chars)
  tags?: string[];            // Hint tags (max 10)
}
\`\`\`

## Response Schema

\`\`\`typescript
interface SkillsResponse {
  success: boolean;
  data: {
    answer: string;           // Markdown response
    confidence: number;       // 0-1 confidence score
    basedOn: number;          // Similar questions used
    skillsIdentified: string[];
    sessionId?: string;
    suggestedFollowups?: string[];
  };
  meta: {
    cached: boolean;
    questionId: string;
    processingMs: number;
  };
}
\`\`\`

---

*Last updated: ${new Date().toISOString()}*
`;

  return markdown;
}

/**
 * Use Cases Generation Library
 *
 * Transforms qualifying scenarios into marketing-ready use cases with AI-generated content.
 *
 * Qualification criteria:
 * - qualityScore >= 0.3
 * - totalRuns >= 1
 * - lastRunStatus = 'pass'
 */

import { openai } from '@ai-sdk/openai';
import { Prisma, prisma } from '@tpmjs/db';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Simple slugify function - converts string to URL-friendly slug
 */
function slugify(
  text: string,
  options?: { lower?: boolean; strict?: boolean; maxLength?: number }
): string {
  let result = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

  if (options?.maxLength) {
    result = result.slice(0, options.maxLength);
  }

  if (options?.strict) {
    result = result.replace(/[^a-z0-9-]/g, '');
  }

  return result;
}

// ============================================================================
// Types
// ============================================================================

interface ScenarioWithRelations {
  id: string;
  prompt: string;
  name: string | null;
  description: string | null;
  tags: string[];
  qualityScore: number;
  totalRuns: number;
  consecutivePasses: number;
  lastRunStatus: string | null;
  lastRunAt: Date | null;
  collection: {
    id: string;
    name: string;
    slug: string | null;
    user: {
      username: string | null;
    };
  } | null;
}

interface GeneratedUseCaseData {
  marketingTitle: string;
  marketingDesc: string;
  roiEstimate: string;
  businessValue: string;
  problemStatement: string;
  solutionNarrative: string;
  personas: Array<{ name: string; slug: string }>;
  industries: Array<{ name: string; slug: string }>;
  categories: Array<{ name: string; slug: string; type: string }>;
}

interface UseCaseGenerationResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

const GENERATION_SLICE_DEFAULT = 5;
const RANK_SLICE_DEFAULT = 500;

function rankScoreForScenario(scenario: {
  qualityScore: number;
  totalRuns: number;
  lastRunStatus: string | null;
}): number {
  const recentPassBonus = scenario.lastRunStatus === 'pass' ? 1.2 : 1;
  return Number(scenario.qualityScore) * (1 + Math.log10(scenario.totalRuns + 1)) * recentPassBonus;
}

// ============================================================================
// AI Schema
// ============================================================================

const PersonaSchema = z.object({
  name: z.string().describe('Persona name (e.g., "CTO", "Product Manager")'),
  slug: z.string().describe('URL-friendly slug (e.g., "cto", "product-manager")'),
});

const IndustrySchema = z.object({
  name: z.string().describe('Industry name (e.g., "SaaS", "E-commerce")'),
  slug: z.string().describe('URL-friendly slug (e.g., "saas", "ecommerce")'),
});

const CategorySchema = z.object({
  name: z.string().describe('Category name'),
  slug: z.string().describe('URL-friendly slug'),
  type: z.enum(['functional', 'business-process', 'technical']).describe('Category type'),
});

const UseCaseGenerationSchema = z.object({
  marketingTitle: z.string().max(200).describe('Concise, benefit-driven headline (max 200 chars)'),
  marketingDesc: z.string().describe('2-3 sentence value proposition for marketing pages'),
  roiEstimate: z
    .string()
    .describe('Time/cost savings estimate (e.g., "Saves ~10 hours/week", "Reduces costs by 30%")'),
  businessValue: z.string().describe('Clear "what this solves" statement for business users'),
  problemStatement: z.string().describe('Description of the business problem this use case solves'),
  solutionNarrative: z
    .string()
    .describe('How this solution works - the story of problem → solution'),
  personas: z
    .array(PersonaSchema)
    .min(1)
    .max(5)
    .describe('1-5 personas that would care about this use case'),
  industries: z
    .array(IndustrySchema)
    .min(1)
    .max(5)
    .describe('1-5 industries this use case applies to'),
  categories: z.array(CategorySchema).min(1).max(5).describe('1-5 categories for this use case'),
});

// ============================================================================
// AI Generation
// ============================================================================

/**
 * Generate marketing content for a scenario
 */
async function generateMarketingContent(
  scenario: ScenarioWithRelations
): Promise<GeneratedUseCaseData> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: UseCaseGenerationSchema,
    system: `You are a marketing expert specializing in B2B SaaS and AI tools.
Your task is to transform technical test scenarios into compelling marketing use cases that read like natural, human-written copy.

Guidelines:
1. Write clear, benefit-focused titles that resonate with business users
2. Describe value in terms of time saved, costs reduced, or problems solved
3. Be specific about ROI - use realistic estimates
4. Identify the right personas (technical and non-technical roles)
5. Select relevant industries where this use case applies
6. Categorize appropriately:
   - functional: what it does (automation, analysis, monitoring)
   - business-process: business area (customer-support, sales, hr)
   - technical: technical domain (api-integration, data-processing)

Writing rules (avoid AI tell-tales):
- Avoid inflated significance, trend talk, or vague "experts say" attributions.
- Avoid promo hype, generic positivity, and grand claims.
- Prefer simple copula sentences ("is/are/has") over "serves as/stands as/boasts."
- Avoid filler and hedging, rule-of-three padding, and negative parallelism.
- Avoid em dashes, bolded lists, emojis, and title-case headings.
- Use concrete details and natural rhythm with varied sentence length.

For personas, use common roles like:
- CTO, VP Engineering, Engineering Manager
- Product Manager, Product Owner
- Developer, Software Engineer, Full Stack Developer
- Founder, CEO, Business Owner
- Sales Lead, Marketing Manager
- Support Lead, Customer Success Manager
- Data Analyst, Data Scientist
- DevOps Engineer, SRE

For industries, use common verticals like:
- SaaS, E-commerce, FinTech
- Healthcare, EdTech, LegalTech
- Manufacturing, Retail, Logistics
- Media, Gaming, Entertainment

For categories:
- Functional: automation, data-analysis, monitoring, integration, content-generation
- Business Process: customer-support, sales, marketing, hr, finance, operations
- Technical: api-integration, data-processing, web-scraping, workflow-automation`,
    prompt: buildPromptForScenario(scenario),
  });

  return object;
}

/**
 * Build the AI prompt for scenario analysis
 */
function buildPromptForScenario(scenario: ScenarioWithRelations): string {
  const collectionName = scenario.collection?.name || 'Unknown Collection';
  const collectionOwner = scenario.collection?.user.username || 'unknown';

  return `Analyze this test scenario and generate marketing content.

**Collection:** ${collectionName} (by @${collectionOwner})
**Scenario Name:** ${scenario.name || 'Untitled'}
**Scenario Prompt:** ${scenario.prompt}
**Tags:** ${scenario.tags.join(', ') || 'None'}
**Quality Score:** ${(scenario.qualityScore * 100).toFixed(0)}%
**Total Runs:** ${scenario.totalRuns}
**Success Rate:** ${scenario.lastRunStatus === 'pass' ? 'Passing' : 'Failing'}

Generate marketing content that:
1. Has a compelling, benefit-driven title (not technical jargon)
2. Explains the value proposition in business terms
3. Identifies who would care (personas) and what industries
4. Estimates ROI in realistic terms (hours saved, costs reduced)
5. Describes the problem and solution narrative

Important:
- The title should be marketing-friendly, not technical
- Focus on OUTCOMES, not features
- Be specific but realistic about ROI
- Choose personas that would actually care about this use case
- Select industries where this would be valuable`;
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get or create a persona
 */
async function getOrCreatePersona(name: string, slug: string): Promise<{ id: string }> {
  // Try to find existing by slug first
  let persona = await prisma.persona.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!persona) {
    // Try to find by name
    persona = await prisma.persona.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  if (!persona) {
    persona = await prisma.persona.create({
      data: {
        name,
        slug,
        // Generate icon based on first letter
        icon: name.charAt(0).toUpperCase(),
      },
      select: { id: true },
    });
  }

  return persona;
}

/**
 * Get or create an industry
 */
async function getOrCreateIndustry(name: string, slug: string): Promise<{ id: string }> {
  let industry = await prisma.industry.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!industry) {
    industry = await prisma.industry.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  if (!industry) {
    industry = await prisma.industry.create({
      data: { name, slug },
      select: { id: true },
    });
  }

  return industry;
}

/**
 * Get or create a category
 */
async function getOrCreateCategory(
  name: string,
  slug: string,
  type: string
): Promise<{ id: string }> {
  let category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!category) {
    category = await prisma.category.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  if (!category) {
    category = await prisma.category.create({
      data: { name, slug, type },
      select: { id: true },
    });
  }

  return category;
}

/**
 * Generate a unique slug for a use case
 */
function generateUseCaseSlug(marketingTitle: string, scenarioId: string): string {
  const baseSlug = slugify(marketingTitle, {
    lower: true,
    strict: true,
    maxLength: 100,
  });

  // Add scenario ID suffix for uniqueness
  return `${baseSlug}-${scenarioId.slice(0, 8)}`;
}

/**
 * Update or create social proof for a use case
 */
async function updateSocialProof(
  useCaseId: string,
  scenario: ScenarioWithRelations
): Promise<void> {
  // Calculate success rate
  const passCount = await prisma.scenarioRun.count({
    where: {
      scenarioId: scenario.id,
      status: 'pass',
    },
  });

  const successRate = scenario.totalRuns > 0 ? passCount / scenario.totalRuns : null;

  // Generate human-readable "last run ago" string
  let lastRunAgo: string | null = null;
  if (scenario.lastRunAt) {
    const now = new Date();
    const diffMs = now.getTime() - scenario.lastRunAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      lastRunAgo = 'Today';
    } else if (diffDays === 1) {
      lastRunAgo = 'Yesterday';
    } else if (diffDays < 7) {
      lastRunAgo = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      lastRunAgo = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      lastRunAgo = `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      lastRunAgo = `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  await prisma.socialProof.upsert({
    where: { useCaseId },
    create: {
      useCaseId,
      qualityScore: scenario.qualityScore,
      totalRuns: scenario.totalRuns,
      consecutivePasses: scenario.consecutivePasses,
      lastRunStatus: scenario.lastRunStatus,
      lastRunAt: scenario.lastRunAt,
      successRate,
      lastRunAgo,
    },
    update: {
      qualityScore: scenario.qualityScore,
      totalRuns: scenario.totalRuns,
      consecutivePasses: scenario.consecutivePasses,
      lastRunStatus: scenario.lastRunStatus,
      lastRunAt: scenario.lastRunAt,
      successRate,
      lastRunAgo,
    },
  });
}

/**
 * Create or update a use case from a scenario
 */
async function createOrUpdateUseCase(
  scenario: ScenarioWithRelations
): Promise<'created' | 'updated' | 'skipped'> {
  // Check if use case already exists
  const existing = await prisma.useCase.findUnique({
    where: { scenarioId: scenario.id },
    include: {
      personas: true,
      industries: true,
      categories: true,
    },
  });

  // Check if we need to regenerate (7 days since last generation)
  const shouldRegenerate =
    !existing ||
    !existing.lastRegeneratedAt ||
    Date.now() - existing.lastRegeneratedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

  if (!shouldRegenerate) {
    return 'skipped';
  }

  // Generate marketing content
  const marketingData = await generateMarketingContent(scenario);

  // Generate slug
  const slug = generateUseCaseSlug(marketingData.marketingTitle, scenario.id);

  // Get or create personas
  const personaIds = await Promise.all(
    marketingData.personas.map((p) => getOrCreatePersona(p.name, p.slug))
  );

  // Get or create industries
  const industryIds = await Promise.all(
    marketingData.industries.map((i) => getOrCreateIndustry(i.name, i.slug))
  );

  // Get or create categories
  const categoryIds = await Promise.all(
    marketingData.categories.map((c) => getOrCreateCategory(c.name, c.slug, c.type))
  );
  const generatedAt = new Date();
  const rankScore = rankScoreForScenario(scenario);

  // Create or update use case
  const useCase = await prisma.useCase.upsert({
    where: { scenarioId: scenario.id },
    create: {
      scenarioId: scenario.id,
      slug,
      marketingTitle: marketingData.marketingTitle,
      marketingDesc: marketingData.marketingDesc,
      roiEstimate: marketingData.roiEstimate,
      businessValue: marketingData.businessValue,
      problemStatement: marketingData.problemStatement,
      solutionNarrative: marketingData.solutionNarrative,
      rankScore,
      lastRankedAt: generatedAt,
      lastRegeneratedAt: generatedAt,
      personas: {
        create: personaIds.map((p, idx) => ({
          personaId: p.id,
          relevance: 1 - idx * 0.1, // Decreasing relevance
        })),
      },
      industries: {
        create: industryIds.map((i) => ({ industryId: i.id })),
      },
      categories: {
        create: categoryIds.map((c) => ({ categoryId: c.id })),
      },
    },
    update: {
      marketingTitle: marketingData.marketingTitle,
      marketingDesc: marketingData.marketingDesc,
      roiEstimate: marketingData.roiEstimate,
      businessValue: marketingData.businessValue,
      problemStatement: marketingData.problemStatement,
      solutionNarrative: marketingData.solutionNarrative,
      rankScore,
      lastRegeneratedAt: generatedAt,
      lastRankedAt: generatedAt,
      // Replace relations
      personas: {
        deleteMany: {},
        create: personaIds.map((p, idx) => ({
          personaId: p.id,
          relevance: 1 - idx * 0.1,
        })),
      },
      industries: {
        deleteMany: {},
        create: industryIds.map((i) => ({ industryId: i.id })),
      },
      categories: {
        deleteMany: {},
        create: categoryIds.map((c) => ({ categoryId: c.id })),
      },
    },
  });

  // Update social proof
  await updateSocialProof(useCase.id, scenario);

  return existing ? 'updated' : 'created';
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate use cases for all qualifying scenarios
 */
export async function generateUseCasesForQualifyingScenarios(): Promise<UseCaseGenerationResult> {
  const result: UseCaseGenerationResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const regenerationCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Select only work that is actually due. The old top-100 query repeatedly
  // loaded fresh rows that createOrUpdateUseCase then skipped, starving older
  // candidates. A daily AI lane gets a deliberately small fixed budget.
  const scenarios = await prisma.scenario.findMany({
    where: {
      qualityScore: { gte: 0 },
      totalRuns: { gte: 0 },
      lastRunStatus: 'pass',
      OR: [
        { useCase: { is: null } },
        { useCase: { is: { lastRegeneratedAt: { lt: regenerationCutoff } } } },
      ],
    },
    include: {
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'asc' }, { qualityScore: 'desc' }],
    take: GENERATION_SLICE_DEFAULT,
  });

  for (const scenario of scenarios) {
    try {
      const status = await createOrUpdateUseCase(scenario);
      if (status === 'created') result.created++;
      else if (status === 'updated') result.updated++;
      else result.skipped++;
    } catch (error) {
      result.errors++;
      result.errorDetails.push(
        `Scenario ${scenario.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
}

// ============================================================================
// Ranking Algorithm
// ============================================================================

/**
 * Refresh one finite dirty rank slice in a single SQL statement. Scenario
 * updated_at is the invalidation token; unchanged rows are never revisited.
 */
export async function computeRankScores(limit = RANK_SLICE_DEFAULT): Promise<number> {
  const boundedLimit = Math.min(2_000, Math.max(1, Math.floor(limit)));
  const updated = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH due AS (
      SELECT u.id,
             s.quality_score,
             s.total_runs,
             s.last_run_status
      FROM use_cases u
      JOIN scenarios s ON s.id = u.scenario_id
      WHERE u.last_ranked_at < s.updated_at
      ORDER BY s.updated_at, u.id
      FOR UPDATE OF u SKIP LOCKED
      LIMIT ${boundedLimit}
    )
    UPDATE use_cases u
    SET rank_score = due.quality_score
                     * (1 + log(10::numeric, (due.total_runs + 1)::numeric))
                     * CASE WHEN due.last_run_status = 'pass' THEN 1.2 ELSE 1 END,
        last_ranked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    FROM due
    WHERE u.id = due.id
    RETURNING u.id
  `);
  return updated.length;
}

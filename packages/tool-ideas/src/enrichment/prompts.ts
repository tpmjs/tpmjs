import type { Category, Context, ToolObject, Verb } from '../db/schema.js';

// =============================================================================
// SKELETON WITH LOADED RELATIONS
// =============================================================================

export interface SkeletonWithRelations {
  id: number;
  hash: string;
  rawName: string;
  compatibilityScore: number;
  category: Category;
  verb: Verb;
  object: ToolObject;
  context: Context | null;
}

// =============================================================================
// SINGLE TOOL ENRICHMENT PROMPT
// =============================================================================

export function createEnrichmentPrompt(skeleton: SkeletonWithRelations): string {
  return `You are designing a realistic AI tool for the TPMJS tool registry. Create a complete, practical tool specification.

## Tool Skeleton
- **Category**: ${skeleton.category.name} (${skeleton.category.description})
- **Verb**: ${skeleton.verb.name} (${skeleton.verb.verbType} verb, gerund: ${skeleton.verb.gerund})
- **Object**: ${skeleton.object.name} (${skeleton.object.domain} domain)
${skeleton.context ? `- **Context**: ${skeleton.context.name} (${skeleton.context.contextType})` : ''}
- **Raw Name**: ${skeleton.rawName}
- **Compatibility Score**: ${skeleton.compatibilityScore.toFixed(2)}

## Requirements

### 1. Name (MUST follow format)
Use format: \`category.verbObject\`
Examples: \`data.parseCSV\`, \`security.scanVulnerabilities\`, \`docs.generateChangelog\`

### 2. Description (50-500 chars)
Explain what the tool does in clear, practical terms. Focus on:
- What input it accepts
- What processing it performs
- What output it produces

### 3. Parameters (1-10 typed inputs)
Design practical parameters an agent would need:
- Use camelCase names
- Include types: string, number, boolean, array, object
- Mark required: true or false
- defaultValue: string representation of default (use empty string "" if none)

### 4. Returns
Describe the output structure the tool produces.

### 5. AI Agent Guidance
Help AI agents understand when to use this tool:
- useCase: Detailed explanation of scenarios (30-500 chars)
- limitations: What it can't do (optional)
- examples: 1-3 example user requests

### 6. Tags (2-8)
Keywords for discovery: action type, domain, use case.

### 7. Examples (1-3)
Realistic input examples with descriptions. Use inputJson field with valid JSON string.

## Quality Assessment

Evaluate if this tool makes practical sense:
- **1.0**: Highly practical, clear use case, well-defined I/O
- **0.7-0.9**: Practical with some edge cases
- **0.4-0.6**: Niche use case but valid
- **0.1-0.3**: Marginal utility
- **0.0**: Nonsensical combination

If the combination doesn't make sense (e.g., "parse + Meeting" or "transcribe + JSON"):
- Set \`isNonsensical: true\`
- Set \`nonsenseReason\` to explain why
- Still fill all other fields with best effort

Note: ALL fields are required. Use empty string "" for optional text fields when not applicable.

Respond with valid JSON matching the schema.`;
}

// =============================================================================
// BATCH ENRICHMENT PROMPT
// =============================================================================

export function createBatchEnrichmentPrompt(skeletons: SkeletonWithRelations[]): string {
  const skeletonList = skeletons
    .map(
      (s, i) => `
### Tool ${i + 1}
- **ID**: ${s.id}
- **Category**: ${s.category.name} (${s.category.description})
- **Verb**: ${s.verb.name} (${s.verb.verbType})
- **Object**: ${s.object.name} (${s.object.domain})
${s.context ? `- **Context**: ${s.context.name}` : ''}
- **Raw Name**: ${s.rawName}
- **Score**: ${s.compatibilityScore.toFixed(2)}
`
    )
    .join('\n');

  return `You are designing realistic AI tools for the TPMJS tool registry. Create complete specifications for ${skeletons.length} tools.

## Tool Skeletons
${skeletonList}

## Requirements for EACH tool

1. **Name**: category.verbObject format (e.g., data.parseCSV)
2. **Description**: 50-500 chars, practical explanation
3. **Parameters**: 1-10 typed inputs with descriptions
4. **Returns**: Output type and description
5. **AI Agent Guidance**: useCase (when to use), limitations, examples
6. **Tags**: 2-8 keywords for discovery
7. **Examples**: 1-3 realistic usage examples

## Quality Scoring

- 1.0: Highly practical, production-ready concept
- 0.7-0.9: Good use case with minor limitations
- 0.4-0.6: Niche but valid
- 0.1-0.3: Marginal utility
- 0.0: Nonsensical

Mark nonsensical combinations with isNonsensical=true and explain why.

Return an array of ${skeletons.length} tool specifications.`;
}

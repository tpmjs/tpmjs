/**
 * Learning Objective Write Tool for TPMJS
 * Writes measurable learning objectives using Bloom's taxonomy verbs
 */

import { jsonSchema, tool } from 'ai';

/**
 * Bloom's taxonomy levels
 */
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

/**
 * Single learning objective
 */
export interface LearningObjective {
  objective: string;
  level: BloomLevel;
  verb: string;
  measurable: boolean;
}

/**
 * Learning objectives output
 */
export interface LearningObjectives {
  topic: string;
  level: BloomLevel;
  objectives: LearningObjective[];
  formatted: string;
}

type LearningObjectiveWriteInput = {
  topic: string;
  level: BloomLevel;
};

/**
 * Bloom's taxonomy verb mappings by level
 */
const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  remember: [
    'define',
    'identify',
    'list',
    'name',
    'recall',
    'recognize',
    'state',
    'describe',
    'match',
    'select',
  ],
  understand: [
    'explain',
    'summarize',
    'interpret',
    'classify',
    'compare',
    'contrast',
    'demonstrate',
    'illustrate',
    'paraphrase',
    'predict',
  ],
  apply: [
    'apply',
    'calculate',
    'complete',
    'demonstrate',
    'execute',
    'implement',
    'solve',
    'use',
    'operate',
    'practice',
  ],
  analyze: [
    'analyze',
    'categorize',
    'compare',
    'contrast',
    'differentiate',
    'distinguish',
    'examine',
    'investigate',
    'organize',
    'relate',
  ],
  evaluate: [
    'assess',
    'critique',
    'evaluate',
    'judge',
    'justify',
    'recommend',
    'support',
    'defend',
    'prioritize',
    'rate',
  ],
  create: [
    'create',
    'design',
    'develop',
    'formulate',
    'construct',
    'compose',
    'plan',
    'produce',
    'synthesize',
    'generate',
  ],
};

/**
 * Validates Bloom's taxonomy level
 */
function validateBloomLevel(level: unknown): level is BloomLevel {
  const validLevels: BloomLevel[] = [
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ];

  if (typeof level !== 'string') {
    throw new Error('Level must be a string');
  }

  if (!validLevels.includes(level as BloomLevel)) {
    throw new Error(`Level must be one of: ${validLevels.join(', ')}. Received: ${level}`);
  }

  return true;
}

/**
 * Gets random verb for a Bloom's level
 */
function getVerbForLevel(level: BloomLevel): string {
  const verbs = BLOOM_VERBS[level];
  const randomIndex = Math.floor(Math.random() * verbs.length);
  const verb = verbs[randomIndex];
  if (!verb) {
    return verbs[0] || 'understand';
  }
  return verb;
}

/**
 * Capitalizes first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates a learning objective for a topic and level
 */
function generateObjective(topic: string, level: BloomLevel): LearningObjective {
  const verb = getVerbForLevel(level);
  const topicLower = topic.toLowerCase();

  let objective = '';

  // Generate objective based on level
  switch (level) {
    case 'remember':
      objective = `${capitalize(verb)} key concepts and terminology related to ${topicLower}`;
      break;
    case 'understand':
      objective = `${capitalize(verb)} the fundamental principles of ${topicLower}`;
      break;
    case 'apply':
      objective = `${capitalize(verb)} ${topicLower} techniques to solve practical problems`;
      break;
    case 'analyze':
      objective = `${capitalize(verb)} different aspects of ${topicLower} to understand relationships and patterns`;
      break;
    case 'evaluate':
      objective = `${capitalize(verb)} the effectiveness of different approaches to ${topicLower}`;
      break;
    case 'create':
      objective = `${capitalize(verb)} original solutions or products using ${topicLower}`;
      break;
  }

  return {
    objective,
    level,
    verb,
    measurable: true,
  };
}

/**
 * Generates multiple learning objectives
 */
function generateObjectives(topic: string, level: BloomLevel, count = 3): LearningObjective[] {
  const objectives: LearningObjective[] = [];
  const usedVerbs = new Set<string>();

  for (let i = 0; i < count; i++) {
    let verb: string;
    let attempts = 0;

    // Try to get a unique verb
    do {
      verb = getVerbForLevel(level);
      attempts++;
    } while (usedVerbs.has(verb) && attempts < 10);

    usedVerbs.add(verb);

    const objective = generateObjective(topic, level);
    // Override verb if we got a different one
    if (objective.verb !== verb) {
      objective.verb = verb;
      objective.objective = objective.objective.replace(
        new RegExp(`^${objective.verb}`, 'i'),
        capitalize(verb)
      );
    }

    objectives.push(objective);
  }

  return objectives;
}

/**
 * Gets description for Bloom's level
 */
function getLevelDescription(level: BloomLevel): string {
  const descriptions: Record<BloomLevel, string> = {
    remember: 'Recall facts and basic concepts',
    understand: 'Explain ideas or concepts',
    apply: 'Use information in new situations',
    analyze: 'Draw connections among ideas',
    evaluate: 'Justify a decision or course of action',
    create: 'Produce new or original work',
  };

  return descriptions[level];
}

/**
 * Formats learning objectives as markdown
 */
function formatLearningObjectives(objectives: Omit<LearningObjectives, 'formatted'>): string {
  const levelDescription = getLevelDescription(objectives.level);

  let formatted = `# Learning Objectives

## Topic: ${objectives.topic}

**Bloom's Taxonomy Level:** ${capitalize(objectives.level)}
**Level Description:** ${levelDescription}

---

## Objectives

Students will be able to:

`;

  for (let i = 0; i < objectives.objectives.length; i++) {
    const obj = objectives.objectives[i];
    if (obj) {
      formatted += `${i + 1}. **${obj.objective}**\n`;
      formatted += `   - Action Verb: *${obj.verb}*\n`;
      formatted += `   - Measurable: ${obj.measurable ? 'Yes' : 'No'}\n\n`;
    }
  }

  formatted += `---

## Bloom's Taxonomy Reference

This objective targets the **${capitalize(objectives.level)}** level of Bloom's Taxonomy.

### Common Action Verbs for ${capitalize(objectives.level)} Level:

${BLOOM_VERBS[objectives.level].map((v) => `- ${capitalize(v)}`).join('\n')}
`;

  return formatted;
}

/**
 * Learning Objective Write Tool
 * Writes measurable learning objectives using Bloom's taxonomy verbs
 */
export const learningObjectiveWriteTool = tool({
  description:
    "Write measurable learning objectives using Bloom's taxonomy verbs. Generates specific, actionable objectives aligned to the appropriate cognitive level (remember, understand, apply, analyze, evaluate, create).",
  inputSchema: jsonSchema<LearningObjectiveWriteInput>({
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic or skill to create learning objectives for',
      },
      level: {
        type: 'string',
        enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        description:
          "Bloom's taxonomy level (remember, understand, apply, analyze, evaluate, create)",
      },
    },
    required: ['topic', 'level'],
    additionalProperties: false,
  }),
  async execute({ topic, level }): Promise<LearningObjectives> {
    // Validate topic
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new Error('Topic is required and must be a non-empty string');
    }

    // Validate level
    validateBloomLevel(level);

    // Generate objectives (3 by default)
    const objectives = generateObjectives(topic.trim(), level, 3);

    // Build result object
    const result: Omit<LearningObjectives, 'formatted'> = {
      topic: topic.trim(),
      level,
      objectives,
    };

    // Format as markdown
    const formatted = formatLearningObjectives(result);

    return {
      ...result,
      formatted,
    };
  },
});

export default learningObjectiveWriteTool;

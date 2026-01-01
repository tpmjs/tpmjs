/**
 * Curriculum Map Tool for TPMJS
 * Maps curriculum standards to learning activities and assessments
 */

import { jsonSchema, tool } from 'ai';

/**
 * Curriculum standard
 */
export interface CurriculumStandard {
  id: string;
  description: string;
  domain?: string;
  gradeLevel?: string;
}

/**
 * Learning activity
 */
export interface LearningActivity {
  id: string;
  name: string;
  description: string;
  type?: 'lesson' | 'activity' | 'project' | 'assessment' | 'discussion';
  duration?: string;
}

/**
 * Course unit with activities
 */
export interface CourseUnit {
  id: string;
  name: string;
  description?: string;
  activities: LearningActivity[];
}

/**
 * Mapping between standard and activities
 */
export interface StandardMapping {
  standard: CurriculumStandard;
  activities: LearningActivity[];
  coverage: number; // percentage 0-100
}

/**
 * Coverage statistics
 */
export interface CoverageStats {
  totalStandards: number;
  mappedStandards: number;
  unmappedStandards: CurriculumStandard[];
  coveragePercentage: number;
}

/**
 * Complete curriculum map
 */
export interface CurriculumMap {
  standards: CurriculumStandard[];
  units: CourseUnit[];
  mappings: StandardMapping[];
  coverage: CoverageStats;
  formatted: string;
}

type CurriculumMapInput = {
  standards: CurriculumStandard[];
  units: CourseUnit[];
};

/**
 * Validates standards array
 */
function validateStandards(standards: unknown): standards is CurriculumStandard[] {
  if (!Array.isArray(standards)) {
    throw new Error('Standards must be an array');
  }

  if (standards.length === 0) {
    throw new Error('At least one standard is required');
  }

  if (standards.length > 100) {
    throw new Error('Standards array cannot exceed 100 items');
  }

  for (let i = 0; i < standards.length; i++) {
    const standard = standards[i];
    if (!standard || typeof standard !== 'object') {
      throw new Error(`Standard at index ${i} must be an object`);
    }

    const s = standard as Record<string, unknown>;

    if (!s.id || typeof s.id !== 'string' || s.id.trim().length === 0) {
      throw new Error(`Standard at index ${i} must have a non-empty id`);
    }

    if (!s.description || typeof s.description !== 'string' || s.description.trim().length === 0) {
      throw new Error(`Standard ${s.id} must have a non-empty description`);
    }
  }

  return true;
}

/**
 * Validates units array
 */
function validateUnits(units: unknown): units is CourseUnit[] {
  if (!Array.isArray(units)) {
    throw new Error('Units must be an array');
  }

  if (units.length === 0) {
    throw new Error('At least one unit is required');
  }

  if (units.length > 50) {
    throw new Error('Units array cannot exceed 50 items');
  }

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (!unit || typeof unit !== 'object') {
      throw new Error(`Unit at index ${i} must be an object`);
    }

    const u = unit as Record<string, unknown>;

    if (!u.id || typeof u.id !== 'string' || u.id.trim().length === 0) {
      throw new Error(`Unit at index ${i} must have a non-empty id`);
    }

    if (!u.name || typeof u.name !== 'string' || u.name.trim().length === 0) {
      throw new Error(`Unit ${u.id} must have a non-empty name`);
    }

    if (!Array.isArray(u.activities)) {
      throw new Error(`Unit ${u.id} must have an activities array`);
    }

    if (u.activities.length === 0) {
      throw new Error(`Unit ${u.id} must have at least one activity`);
    }

    for (let j = 0; j < u.activities.length; j++) {
      const activity = u.activities[j];
      if (!activity || typeof activity !== 'object') {
        throw new Error(`Activity at index ${j} in unit ${u.id} must be an object`);
      }

      const a = activity as Record<string, unknown>;

      if (!a.id || typeof a.id !== 'string' || a.id.trim().length === 0) {
        throw new Error(`Activity at index ${j} in unit ${u.id} must have a non-empty id`);
      }

      if (!a.name || typeof a.name !== 'string' || a.name.trim().length === 0) {
        throw new Error(`Activity ${a.id} must have a non-empty name`);
      }

      if (
        !a.description ||
        typeof a.description !== 'string' ||
        a.description.trim().length === 0
      ) {
        throw new Error(`Activity ${a.id} must have a non-empty description`);
      }
    }
  }

  return true;
}

/**
 * Calculates keyword similarity between two strings
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const words2 = text2
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let matches = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      matches++;
    }
  }

  return matches / Math.max(set1.size, set2.size);
}

/**
 * Maps standards to activities based on content similarity
 */
function mapStandardsToActivities(
  standards: CurriculumStandard[],
  units: CourseUnit[]
): StandardMapping[] {
  const mappings: StandardMapping[] = [];
  const allActivities: LearningActivity[] = units.flatMap((u) => u.activities);

  for (const standard of standards) {
    const matchedActivities: { activity: LearningActivity; score: number }[] = [];

    for (const activity of allActivities) {
      // Calculate similarity between standard and activity
      const descSimilarity = calculateSimilarity(standard.description, activity.description);
      const nameSimilarity = calculateSimilarity(standard.description, activity.name);
      const score = Math.max(descSimilarity, nameSimilarity);

      if (score > 0.1) {
        // threshold for relevance
        matchedActivities.push({ activity, score });
      }
    }

    // Sort by score and take top matches
    matchedActivities.sort((a, b) => b.score - a.score);
    const topMatches = matchedActivities.slice(0, 5); // max 5 activities per standard

    const coverage = topMatches.length > 0 ? Math.min(100, topMatches.length * 30) : 0;

    mappings.push({
      standard,
      activities: topMatches.map((m) => m.activity),
      coverage,
    });
  }

  return mappings;
}

/**
 * Calculates coverage statistics
 */
function calculateCoverage(
  standards: CurriculumStandard[],
  mappings: StandardMapping[]
): CoverageStats {
  const mappedStandards = mappings.filter((m) => m.activities.length > 0).length;
  const unmappedStandards = standards.filter((s) => {
    const mapping = mappings.find((m) => m.standard.id === s.id);
    return !mapping || mapping.activities.length === 0;
  });

  return {
    totalStandards: standards.length,
    mappedStandards,
    unmappedStandards,
    coveragePercentage: Math.round((mappedStandards / standards.length) * 100),
  };
}

/**
 * Formats standard mapping as markdown section
 */
function formatStandardMapping(mapping: StandardMapping): string {
  let formatted = `### ${mapping.standard.id}: ${mapping.standard.description}\n\n`;

  if (mapping.standard.domain) {
    formatted += `**Domain:** ${mapping.standard.domain}  \n`;
  }
  if (mapping.standard.gradeLevel) {
    formatted += `**Grade Level:** ${mapping.standard.gradeLevel}  \n`;
  }

  formatted += `**Coverage:** ${mapping.coverage}%\n\n`;

  if (mapping.activities.length === 0) {
    formatted += '*No activities mapped to this standard*\n';
  } else {
    formatted += '**Mapped Activities:**\n\n';
    for (const activity of mapping.activities) {
      formatted += `- **${activity.name}** `;
      if (activity.type) {
        formatted += `(${activity.type})`;
      }
      formatted += `  \n  ${activity.description}`;
      if (activity.duration) {
        formatted += ` — *${activity.duration}*`;
      }
      formatted += '\n';
    }
  }

  return formatted;
}

/**
 * Formats unit overview
 */
function formatUnitOverview(unit: CourseUnit): string {
  let formatted = `### ${unit.name}\n\n`;

  if (unit.description) {
    formatted += `${unit.description}\n\n`;
  }

  formatted += `**Activities (${unit.activities.length}):**\n\n`;
  for (const activity of unit.activities) {
    formatted += `- ${activity.name}`;
    if (activity.type) {
      formatted += ` (${activity.type})`;
    }
    formatted += '\n';
  }

  return formatted;
}

/**
 * Formats complete curriculum map
 */
function formatCurriculumMap(map: Omit<CurriculumMap, 'formatted'>): string {
  let formatted = `# Curriculum Map

## Coverage Summary

- **Total Standards:** ${map.coverage.totalStandards}
- **Mapped Standards:** ${map.coverage.mappedStandards}
- **Coverage:** ${map.coverage.coveragePercentage}%

`;

  if (map.coverage.unmappedStandards.length > 0) {
    formatted += `\n**⚠️ Unmapped Standards (${map.coverage.unmappedStandards.length}):**\n\n`;
    for (const standard of map.coverage.unmappedStandards) {
      formatted += `- ${standard.id}: ${standard.description}\n`;
    }
    formatted += '\n';
  }

  formatted += `---

## Units Overview

${map.units.map(formatUnitOverview).join('\n')}

---

## Standards to Activities Mapping

`;

  formatted += map.mappings.map(formatStandardMapping).join('\n---\n\n');

  return formatted;
}

/**
 * Curriculum Map Tool
 * Maps curriculum standards to learning activities and assessments
 */
export const curriculumMapTool = tool({
  description:
    'Create a curriculum map that aligns curriculum standards to learning activities and assessments. Automatically maps activities to standards based on content similarity and tracks coverage.',
  inputSchema: jsonSchema<CurriculumMapInput>({
    type: 'object',
    properties: {
      standards: {
        type: 'array',
        description: 'Curriculum standards to map',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Standard identifier (e.g., CCSS.ELA-LITERACY.RI.9-10.1)',
            },
            description: {
              type: 'string',
              description: 'Standard description',
            },
            domain: {
              type: 'string',
              description: 'Standard domain or category (optional)',
            },
            gradeLevel: {
              type: 'string',
              description: 'Grade level (optional)',
            },
          },
          required: ['id', 'description'],
        },
      },
      units: {
        type: 'array',
        description: 'Course units with activities',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unit identifier',
            },
            name: {
              type: 'string',
              description: 'Unit name',
            },
            description: {
              type: 'string',
              description: 'Unit description (optional)',
            },
            activities: {
              type: 'array',
              description: 'Learning activities in this unit',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Activity identifier',
                  },
                  name: {
                    type: 'string',
                    description: 'Activity name',
                  },
                  description: {
                    type: 'string',
                    description: 'Activity description',
                  },
                  type: {
                    type: 'string',
                    enum: ['lesson', 'activity', 'project', 'assessment', 'discussion'],
                    description: 'Activity type (optional)',
                  },
                  duration: {
                    type: 'string',
                    description: 'Estimated duration (optional)',
                  },
                },
                required: ['id', 'name', 'description'],
              },
            },
          },
          required: ['id', 'name', 'activities'],
        },
      },
    },
    required: ['standards', 'units'],
    additionalProperties: false,
  }),
  async execute({ standards, units }): Promise<CurriculumMap> {
    // Validate inputs
    validateStandards(standards);
    validateUnits(units);

    // Map standards to activities
    const mappings = mapStandardsToActivities(standards, units);

    // Calculate coverage statistics
    const coverage = calculateCoverage(standards, mappings);

    // Build curriculum map object
    const map: Omit<CurriculumMap, 'formatted'> = {
      standards,
      units,
      mappings,
      coverage,
    };

    // Format as markdown
    const formatted = formatCurriculumMap(map);

    return {
      ...map,
      formatted,
    };
  },
});

export default curriculumMapTool;

/**
 * PRD Outline Tool for TPMJS
 * Creates Product Requirements Document outlines from problem statements and features.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for PRD outline
 */
export interface PrdOutlineInput {
  title: string;
  problem: string;
  goals: string[];
  features: string[];
}

/**
 * Output interface for PRD outline
 */
export interface PrdOutline {
  prd: string;
  sections: string[];
  featureCount: number;
}

/**
 * Standard PRD sections
 */
const STANDARD_SECTIONS = [
  'Overview',
  'Problem Statement',
  'Goals',
  'Features',
  'User Stories',
  'Success Metrics',
  'Technical Considerations',
  'Timeline',
  'Open Questions',
];

/**
 * Generates the PRD markdown
 */
function generatePrd(title: string, problem: string, goals: string[], features: string[]): string {
  const lines: string[] = [];

  // Header
  lines.push(`# PRD: ${title}`);
  lines.push('');

  // Metadata
  lines.push('**Status:** Draft');
  lines.push(`**Created:** ${new Date().toISOString().split('T')[0]}`);
  lines.push('**Owner:** [To be assigned]');
  lines.push('');

  lines.push('---');
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push('');
  lines.push(
    `This document outlines the requirements for ${title}. It includes the problem statement, goals, proposed features, and success criteria.`
  );
  lines.push('');

  // Problem Statement
  lines.push('## Problem Statement');
  lines.push('');
  lines.push(problem);
  lines.push('');

  // Goals
  lines.push('## Goals');
  lines.push('');
  for (let i = 0; i < goals.length; i++) {
    lines.push(`${i + 1}. ${goals[i]}`);
  }
  lines.push('');

  // Non-Goals
  lines.push('## Non-Goals');
  lines.push('');
  lines.push('*[To be filled in during review]*');
  lines.push('');

  // Features
  lines.push('## Features');
  lines.push('');
  for (let i = 0; i < features.length; i++) {
    lines.push(`### ${i + 1}. ${features[i]}`);
    lines.push('');
    lines.push('**Description:** [To be expanded]');
    lines.push('');
    lines.push('**Priority:** [High/Medium/Low]');
    lines.push('');
    lines.push('**Dependencies:** [List any dependencies]');
    lines.push('');
  }

  // User Stories
  lines.push('## User Stories');
  lines.push('');
  lines.push('*[To be filled in during review]*');
  lines.push('');
  lines.push('Example format:');
  lines.push('- As a [user type], I want to [action] so that [benefit]');
  lines.push('');

  // Success Metrics
  lines.push('## Success Metrics');
  lines.push('');
  lines.push('*[To be filled in during review]*');
  lines.push('');
  lines.push('Example metrics:');
  lines.push('- User engagement increase');
  lines.push('- Reduction in support tickets');
  lines.push('- Performance improvements');
  lines.push('');

  // Technical Considerations
  lines.push('## Technical Considerations');
  lines.push('');
  lines.push('### Architecture');
  lines.push('');
  lines.push('*[To be filled in by engineering]*');
  lines.push('');
  lines.push('### Security & Privacy');
  lines.push('');
  lines.push('*[To be reviewed by security team]*');
  lines.push('');
  lines.push('### Performance');
  lines.push('');
  lines.push('*[To be reviewed by engineering]*');
  lines.push('');
  lines.push('### Scalability');
  lines.push('');
  lines.push('*[To be reviewed by engineering]*');
  lines.push('');

  // Timeline
  lines.push('## Timeline');
  lines.push('');
  lines.push('| Milestone | Target Date | Status |');
  lines.push('|-----------|-------------|--------|');
  lines.push('| Kickoff | TBD | Pending |');
  lines.push('| Design Review | TBD | Pending |');
  lines.push('| Implementation Start | TBD | Pending |');
  lines.push('| Beta Release | TBD | Pending |');
  lines.push('| General Availability | TBD | Pending |');
  lines.push('');

  // Open Questions
  lines.push('## Open Questions');
  lines.push('');
  lines.push('*[To be resolved during review]*');
  lines.push('');

  // Appendix
  lines.push('## Appendix');
  lines.push('');
  lines.push('### Related Documents');
  lines.push('');
  lines.push('- [Link to design docs]');
  lines.push('- [Link to technical specs]');
  lines.push('');
  lines.push('### Revision History');
  lines.push('');
  lines.push('| Date | Author | Changes |');
  lines.push('|------|--------|---------|');
  lines.push(`| ${new Date().toISOString().split('T')[0]} | [Author] | Initial draft |`);
  lines.push('');

  return lines.join('\n');
}

/**
 * PRD Outline Tool
 * Creates Product Requirements Document outlines
 */
export const prdOutlineTool = tool({
  description:
    'Create PRD (Product Requirements Document) outlines from problem statements and features. Generates structured product documentation following industry best practices.',
  inputSchema: jsonSchema<PrdOutlineInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the product or feature',
      },
      problem: {
        type: 'string',
        description: 'Problem statement describing what needs to be solved',
      },
      goals: {
        type: 'array',
        description: 'Array of goals for the product or feature',
        items: {
          type: 'string',
        },
      },
      features: {
        type: 'array',
        description: 'Array of features to include',
        items: {
          type: 'string',
        },
      },
    },
    required: ['title', 'problem', 'goals', 'features'],
    additionalProperties: false,
  }),
  async execute({ title, problem, goals, features }): Promise<PrdOutline> {
    // Validate inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (!problem || typeof problem !== 'string' || problem.trim().length === 0) {
      throw new Error('Problem is required and must be a non-empty string');
    }

    if (!Array.isArray(goals) || goals.length === 0) {
      throw new Error('Goals must be a non-empty array');
    }

    // Validate each goal
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
        throw new Error(`Goal ${i + 1} must be a non-empty string`);
      }
    }

    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('Features must be a non-empty array');
    }

    // Validate each feature
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature || typeof feature !== 'string' || feature.trim().length === 0) {
        throw new Error(`Feature ${i + 1} must be a non-empty string`);
      }
    }

    // Generate the PRD
    const prd = generatePrd(title, problem, goals, features);

    return {
      prd,
      sections: STANDARD_SECTIONS,
      featureCount: features.length,
    };
  },
});

export default prdOutlineTool;

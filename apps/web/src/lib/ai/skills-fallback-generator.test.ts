import { describe, expect, it } from 'vitest';

import {
  generateRegistrySkillsSummary,
  generateRegistryToolSkills,
} from './skills-fallback-generator';

describe('registry-backed skills documentation', () => {
  it('renders only published tool metadata and preserves the JSON Schema', () => {
    const markdown = generateRegistryToolSkills({
      name: 'lookupWeather',
      description: 'Looks up current weather for a city.',
      packageName: '@example/weather-tools',
      packageVersion: '2.1.0',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
      },
    });

    expect(markdown).toContain('### Skill: lookupWeather');
    expect(markdown).toContain('`@example/weather-tools@2.1.0`');
    expect(markdown).toContain('"required": [');
    expect(markdown).toContain('"city"');
    expect(markdown).toContain('Generated deterministically from TPMJS registry metadata');
    expect(markdown).toContain('does not publish an output contract');
    expect(markdown).not.toContain('generation failed');
    expect(markdown).not.toContain('Source Analysis');
  });

  it('does not invent an input contract when a schema is absent', () => {
    const markdown = generateRegistryToolSkills({
      name: 'legacyTool',
      description: 'A legacy tool.',
      packageName: 'legacy-package',
      inputSchema: null,
    });

    expect(markdown).toContain('No input schema was published');
  });

  it('describes a discovery workflow without asserting semantic compatibility', () => {
    const summary = generateRegistrySkillsSummary(
      { name: 'Operations', description: 'Operational utility tools.' },
      3,
      ['package-a', 'package-a', 'package-b']
    );

    expect(summary.generationMode).toBe('registry-fallback');
    expect(summary.intro).toContain('3 tools across 2 packages');
    expect(summary.workflows).toContain('`tools/list`');
    expect(summary.workflows).toContain('does not establish semantic compatibility');
  });
});

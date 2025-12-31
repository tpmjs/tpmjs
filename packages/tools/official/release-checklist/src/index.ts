/**
 * Release Checklist Tool for TPMJS
 * Generates comprehensive release checklists from component information,
 * tracks readiness status, and identifies blockers.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Component information for release planning
 */
export interface Component {
  name: string;
  hasTests: boolean;
  hasDocs: boolean;
  version: string;
}

/**
 * Individual checklist item
 */
export interface ChecklistItem {
  component: string;
  item: string;
  status: 'complete' | 'incomplete' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'testing' | 'documentation' | 'versioning' | 'quality' | 'deployment';
}

/**
 * Output interface for release checklist generation
 */
export interface ReleaseChecklistResult {
  checklist: string; // Markdown-formatted checklist
  items: ChecklistItem[];
  readyCount: number;
  blockers: string[];
  summary: {
    totalComponents: number;
    componentsReady: number;
    componentsBlocked: number;
    readinessPercentage: number;
    criticalItems: number;
    incompleteItems: number;
  };
}

type ReleaseChecklistInput = {
  components: Component[];
};

/**
 * Validates semantic version format
 */
function isValidSemver(version: string): boolean {
  // Basic semver validation: X.Y.Z or X.Y.Z-prerelease
  const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Determines if a component is ready for release
 */
function isComponentReady(component: Component): boolean {
  return component.hasTests && component.hasDocs && isValidSemver(component.version);
}

/**
 * Generates checklist items for components
 */
function generateChecklistItems(components: Component[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const component of components) {
    // Testing checklist
    items.push({
      component: component.name,
      item: 'Unit tests passing',
      status: component.hasTests ? 'complete' : 'incomplete',
      priority: 'critical',
      category: 'testing',
    });

    // Documentation checklist
    items.push({
      component: component.name,
      item: 'Documentation complete',
      status: component.hasDocs ? 'complete' : 'incomplete',
      priority: 'high',
      category: 'documentation',
    });

    // Version validation
    const validVersion = isValidSemver(component.version);
    items.push({
      component: component.name,
      item: `Version ${component.version} follows semver`,
      status: validVersion ? 'complete' : 'blocked',
      priority: 'critical',
      category: 'versioning',
    });

    // Additional quality checks
    if (component.hasTests) {
      items.push({
        component: component.name,
        item: 'Integration tests passing',
        status: 'incomplete',
        priority: 'high',
        category: 'testing',
      });

      items.push({
        component: component.name,
        item: 'Code coverage meets threshold',
        status: 'incomplete',
        priority: 'medium',
        category: 'quality',
      });
    }

    // Documentation enhancements
    if (component.hasDocs) {
      items.push({
        component: component.name,
        item: 'API documentation reviewed',
        status: 'incomplete',
        priority: 'medium',
        category: 'documentation',
      });

      items.push({
        component: component.name,
        item: 'Changelog updated',
        status: 'incomplete',
        priority: 'high',
        category: 'documentation',
      });
    }
  }

  // Global release items
  items.push(
    {
      component: 'Release',
      item: 'All critical bugs resolved',
      status: 'incomplete',
      priority: 'critical',
      category: 'quality',
    },
    {
      component: 'Release',
      item: 'Security audit completed',
      status: 'incomplete',
      priority: 'critical',
      category: 'quality',
    },
    {
      component: 'Release',
      item: 'Performance benchmarks passing',
      status: 'incomplete',
      priority: 'high',
      category: 'quality',
    },
    {
      component: 'Release',
      item: 'Release notes prepared',
      status: 'incomplete',
      priority: 'high',
      category: 'documentation',
    },
    {
      component: 'Release',
      item: 'Deployment runbook reviewed',
      status: 'incomplete',
      priority: 'high',
      category: 'deployment',
    },
    {
      component: 'Release',
      item: 'Rollback plan documented',
      status: 'incomplete',
      priority: 'critical',
      category: 'deployment',
    },
    {
      component: 'Release',
      item: 'Stakeholders notified',
      status: 'incomplete',
      priority: 'medium',
      category: 'deployment',
    }
  );

  return items;
}

/**
 * Generates markdown checklist from items
 */
function generateMarkdownChecklist(items: ChecklistItem[]): string {
  let markdown = '# Release Checklist\n\n';

  // Group by category
  const categories = ['testing', 'documentation', 'versioning', 'quality', 'deployment'] as const;
  const categoryLabels = {
    testing: 'Testing',
    documentation: 'Documentation',
    versioning: 'Version Management',
    quality: 'Quality Assurance',
    deployment: 'Deployment',
  };

  for (const category of categories) {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length === 0) continue;

    markdown += `## ${categoryLabels[category]}\n\n`;

    // Group by component within category
    const componentGroups = new Map<string, ChecklistItem[]>();
    for (const item of categoryItems) {
      const existing = componentGroups.get(item.component) || [];
      existing.push(item);
      componentGroups.set(item.component, existing);
    }

    for (const [component, componentItems] of componentGroups) {
      if (component !== 'Release') {
        markdown += `### ${component}\n\n`;
      }

      for (const item of componentItems) {
        const checkbox = item.status === 'complete' ? '[x]' : '[ ]';
        const priorityEmoji =
          item.priority === 'critical'
            ? '🔴'
            : item.priority === 'high'
              ? '🟡'
              : item.priority === 'medium'
                ? '🔵'
                : '⚪';
        const blockedLabel = item.status === 'blocked' ? ' **[BLOCKED]**' : '';

        markdown += `- ${checkbox} ${priorityEmoji} ${item.item}${blockedLabel}\n`;
      }

      markdown += '\n';
    }
  }

  // Add legend
  markdown += '---\n\n';
  markdown += '**Priority Legend:**\n';
  markdown += '- 🔴 Critical - Must be completed before release\n';
  markdown += '- 🟡 High - Should be completed before release\n';
  markdown += '- 🔵 Medium - Nice to have\n';
  markdown += '- ⚪ Low - Optional\n\n';

  return markdown;
}

/**
 * Identifies release blockers
 */
function identifyBlockers(components: Component[], items: ChecklistItem[]): string[] {
  const blockers: string[] = [];

  // Check for blocked items
  const blockedItems = items.filter((item) => item.status === 'blocked');
  for (const item of blockedItems) {
    blockers.push(`${item.component}: ${item.item}`);
  }

  // Check for critical incomplete items
  const criticalIncomplete = items.filter(
    (item) => item.status === 'incomplete' && item.priority === 'critical'
  );
  for (const item of criticalIncomplete) {
    blockers.push(`${item.component}: ${item.item} (critical)`);
  }

  // Check for components without tests
  const noTests = components.filter((c) => !c.hasTests);
  for (const component of noTests) {
    blockers.push(`${component.name}: Missing tests (critical)`);
  }

  // Check for components without docs
  const noDocs = components.filter((c) => !c.hasDocs);
  for (const component of noDocs) {
    blockers.push(`${component.name}: Missing documentation (high priority)`);
  }

  // Check for version conflicts
  const versions = components.map((c) => c.version);
  const uniqueVersions = new Set(versions);
  if (versions.length > 1 && versions.length !== uniqueVersions.size) {
    blockers.push('Version conflict: Multiple components share the same version number');
  }

  return blockers;
}

/**
 * Release Checklist Tool
 * Generates comprehensive release checklists from component information
 */
export const releaseChecklistTool = tool({
  description:
    'Generates a comprehensive release checklist from component information. Analyzes components for tests, documentation, and version compliance. Creates a detailed markdown checklist with priority levels, identifies release blockers, and calculates readiness percentage. Useful for release planning, tracking release progress, and ensuring quality standards.',
  inputSchema: jsonSchema<ReleaseChecklistInput>({
    type: 'object',
    properties: {
      components: {
        type: 'array',
        description: 'Array of components to include in the release',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Component name',
            },
            hasTests: {
              type: 'boolean',
              description: 'Whether the component has tests',
            },
            hasDocs: {
              type: 'boolean',
              description: 'Whether the component has documentation',
            },
            version: {
              type: 'string',
              description: 'Semantic version number (e.g., 1.0.0)',
            },
          },
          required: ['name', 'hasTests', 'hasDocs', 'version'],
        },
      },
    },
    required: ['components'],
    additionalProperties: false,
  }),
  async execute({ components }): Promise<ReleaseChecklistResult> {
    // Validate input
    if (!Array.isArray(components)) {
      throw new Error('components must be an array');
    }

    if (components.length === 0) {
      return {
        checklist: '# Release Checklist\n\nNo components provided.',
        items: [],
        readyCount: 0,
        blockers: ['No components to release'],
        summary: {
          totalComponents: 0,
          componentsReady: 0,
          componentsBlocked: 0,
          readinessPercentage: 0,
          criticalItems: 0,
          incompleteItems: 0,
        },
      };
    }

    // Generate checklist items
    const items = generateChecklistItems(components);

    // Identify blockers
    const blockers = identifyBlockers(components, items);

    // Calculate readiness
    const readyComponents = components.filter(isComponentReady);
    const readyCount = readyComponents.length;
    const blockedComponents = components.filter((c) => !isValidSemver(c.version));
    const readinessPercentage = Math.round((readyCount / components.length) * 100);

    // Count incomplete items
    const criticalItems = items.filter((item) => item.priority === 'critical').length;
    const incompleteItems = items.filter((item) => item.status === 'incomplete').length;

    // Generate markdown checklist
    const checklist = generateMarkdownChecklist(items);

    return {
      checklist,
      items,
      readyCount,
      blockers,
      summary: {
        totalComponents: components.length,
        componentsReady: readyCount,
        componentsBlocked: blockedComponents.length,
        readinessPercentage,
        criticalItems,
        incompleteItems,
      },
    };
  },
});

export default releaseChecklistTool;

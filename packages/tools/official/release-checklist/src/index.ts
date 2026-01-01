/**
 * Release Checklist Tool for TPMJS
 * Generates pre-release checklist tailored to stack.
 *
 * Domain rule: stack-specific-checklist - Generates release checklists customized for Next.js, Node.js libraries, React apps
 * Domain rule: release-validation - Validates critical release requirements (tests, builds, CI/CD, versioning)
 * Domain rule: rollback-planning - Ensures rollback plans are documented before release
 */

import { jsonSchema, tool } from 'ai';

/**
 * Individual checklist item
 */
export interface ChecklistItem {
  item: string;
  critical: boolean;
  category: 'code' | 'docs' | 'ops';
  description?: string;
}

/**
 * Output interface for release checklist generation
 */
export interface ReleaseChecklistResult {
  checklist: ChecklistItem[];
  stack: string;
  criticalCount: number;
  optionalCount: number;
}

type ReleaseChecklistInput = {
  stack: string;
};

/**
 * Generates checklist items customized for stack
 * Domain rule: stack_awareness - Customizes for web/app/library stacks
 * Domain rule: critical_items - Marks critical vs optional items
 * Domain rule: categories - Organizes by category (code, docs, ops)
 */
function generateChecklistForStack(stack: string): ChecklistItem[] {
  const normalized = stack.toLowerCase();
  const items: ChecklistItem[] = [];

  // Domain rule: categories - Code category items
  // Domain rule: critical_items - Tests and linting are critical
  items.push(
    {
      item: 'All tests pass',
      critical: true,
      category: 'code',
      description: 'Run full test suite and ensure all tests pass',
    },
    {
      item: 'Linting passes',
      critical: true,
      category: 'code',
      description: 'No linting errors or warnings',
    },
    {
      item: 'Type checking passes',
      critical: false,
      category: 'code',
      description: 'TypeScript type checking without errors',
    },
    {
      item: 'Dependencies updated',
      critical: false,
      category: 'code',
      description: 'All dependencies are up to date with security patches',
    }
  );

  // Domain rule: categories - Docs category items
  // Domain rule: critical_items - Changelog is critical, README is optional
  items.push(
    {
      item: 'Changelog updated',
      critical: true,
      category: 'docs',
      description: 'Document all user-facing changes',
    },
    {
      item: 'README updated',
      critical: false,
      category: 'docs',
      description: 'Update README if API or usage changed',
    },
    {
      item: 'API docs reviewed',
      critical: false,
      category: 'docs',
      description: 'Ensure API documentation is accurate',
    }
  );

  // Domain rule: stack_awareness - Next.js/web stack specific items
  if (normalized.includes('nextjs') || normalized.includes('next')) {
    items.push(
      {
        item: 'Build succeeds in production mode',
        critical: true,
        category: 'code',
        description: 'next build completes without errors',
      },
      {
        item: 'Environment variables documented',
        critical: true,
        category: 'docs',
        description: 'All required env vars are documented',
      },
      {
        item: 'Static pages pre-rendered',
        critical: false,
        category: 'code',
        description: 'Verify static generation works correctly',
      },
      {
        item: 'Image optimization configured',
        critical: false,
        category: 'ops',
        description: 'Next.js image optimization is properly configured',
      },
      {
        item: 'Deployment previews tested',
        critical: true,
        category: 'ops',
        description: 'Test on Vercel preview or similar',
      }
    );
  } // Domain rule: stack_awareness - Node.js library stack specific items
  else if (normalized.includes('node') && normalized.includes('library')) {
    items.push(
      {
        item: 'Package builds successfully',
        critical: true,
        category: 'code',
        description: 'npm run build completes without errors',
      },
      {
        item: 'Exports are properly typed',
        critical: true,
        category: 'code',
        description: 'TypeScript definitions are generated and correct',
      },
      {
        item: 'Package.json fields complete',
        critical: true,
        category: 'code',
        description: 'main, types, exports fields are correctly set',
      },
      {
        item: 'Peer dependencies documented',
        critical: false,
        category: 'docs',
        description: 'Document any peer dependency requirements',
      },
      {
        item: 'npm pack tested locally',
        critical: true,
        category: 'ops',
        description: 'Test the packaged tarball in a separate project',
      }
    );
  } // Domain rule: stack_awareness - React app stack specific items
  else if (normalized.includes('react') && normalized.includes('app')) {
    items.push(
      {
        item: 'Build succeeds',
        critical: true,
        category: 'code',
        description: 'Production build completes without errors',
      },
      {
        item: 'Bundle size checked',
        critical: false,
        category: 'code',
        description: 'Verify bundle size has not increased unexpectedly',
      },
      {
        item: 'Console errors checked',
        critical: true,
        category: 'code',
        description: 'No console errors or warnings in production build',
      },
      {
        item: 'Accessibility checked',
        critical: false,
        category: 'code',
        description: 'Run accessibility audits',
      },
      {
        item: 'Hosting platform configured',
        critical: true,
        category: 'ops',
        description: 'Ensure hosting platform is properly configured',
      }
    );
  } else {
    // Domain rule: stack_awareness - Generic stack fallback
    items.push(
      {
        item: 'Build succeeds',
        critical: true,
        category: 'code',
        description: 'Production build completes without errors',
      },
      {
        item: 'Integration tests pass',
        critical: false,
        category: 'code',
        description: 'Run integration test suite',
      }
    );
  }

  // Domain rule: categories - Ops category items (common to all stacks)
  // Domain rule: critical_items - Version, git tag, CI/CD, rollback are critical
  items.push(
    {
      item: 'Version bumped',
      critical: true,
      category: 'ops',
      description: 'Update version number following semver',
    },
    {
      item: 'Git tag created',
      critical: true,
      category: 'ops',
      description: 'Create git tag matching version',
    },
    {
      item: 'CI/CD pipeline passing',
      critical: true,
      category: 'ops',
      description: 'All CI/CD checks pass',
    },
    {
      item: 'Rollback plan documented',
      critical: true,
      category: 'ops',
      description: 'Document how to rollback if issues arise',
    }
  );

  return items;
}

/**
 * Release Checklist Tool
 * Generates pre-release checklist tailored to stack
 */
export const releaseChecklistTool = tool({
  description:
    'Generates pre-release checklist tailored to stack (nextjs, node-library, react-app). Customizes checklist items based on technology stack, marks critical vs optional items, and organizes by category (code, docs, ops).',
  inputSchema: jsonSchema<ReleaseChecklistInput>({
    type: 'object',
    properties: {
      stack: {
        type: 'string',
        description: 'Technology stack (nextjs, node-library, react-app)',
      },
    },
    required: ['stack'],
    additionalProperties: false,
  }),
  async execute({ stack }): Promise<ReleaseChecklistResult> {
    // Validate input
    if (!stack || typeof stack !== 'string') {
      throw new Error('stack is required and must be a string');
    }

    if (stack.trim().length === 0) {
      throw new Error('stack cannot be empty');
    }

    // Generate checklist items for the stack
    const checklist = generateChecklistForStack(stack);

    // Count critical and optional items
    const criticalCount = checklist.filter((item) => item.critical).length;
    const optionalCount = checklist.filter((item) => !item.critical).length;

    return {
      checklist,
      stack,
      criticalCount,
      optionalCount,
    };
  },
});

export default releaseChecklistTool;

'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { FieldsetSection, SubSection, DoDontCard } from './shared';

const glossaryTerms = [
  { term: 'Tool', definition: 'A reusable MCP server or utility that can be installed via npm', avoid: 'Package, Module, Plugin' },
  { term: 'Agent', definition: 'An AI-powered assistant that uses tools to complete tasks', avoid: 'Bot, Assistant, AI' },
  { term: 'Collection', definition: 'A curated group of related tools', avoid: 'Bundle, Set, Kit' },
  { term: 'Publish', definition: 'Release a new version to the registry', avoid: 'Deploy, Ship, Push' },
  { term: 'Install', definition: 'Add a tool to your project dependencies', avoid: 'Download, Get, Add' },
  { term: 'Execute', definition: 'Run a tool with specific parameters', avoid: 'Invoke, Call, Trigger' },
];

const verbConsistency = [
  { action: 'Remove permanently', use: 'Delete', avoid: 'Remove, Erase, Destroy' },
  { action: 'Remove from list', use: 'Remove', avoid: 'Delete, Drop, Clear' },
  { action: 'Cancel access', use: 'Revoke', avoid: 'Remove, Delete, Cancel' },
  { action: 'Make inactive', use: 'Disable', avoid: 'Turn off, Deactivate' },
  { action: 'Make active', use: 'Enable', avoid: 'Turn on, Activate' },
  { action: 'Start new', use: 'Create', avoid: 'Add, New, Make' },
  { action: 'Change existing', use: 'Edit', avoid: 'Modify, Update, Change' },
  { action: 'Look at details', use: 'View', avoid: 'See, Show, Open' },
];

const iconUsageRules = [
  { icon: 'check', usage: 'Success, completion, enabled', size: 'sm-md' },
  { icon: 'x', usage: 'Close, cancel, remove, disabled', size: 'sm-md' },
  { icon: 'alertCircle', usage: 'Error, critical issue', size: 'sm-md' },
  { icon: 'alertTriangle', usage: 'Warning, caution needed', size: 'sm-md' },
  { icon: 'info', usage: 'Information, help', size: 'sm-md' },
  { icon: 'loader', usage: 'Loading, processing', size: 'sm-md' },
  { icon: 'search', usage: 'Search input, find action', size: 'sm' },
  { icon: 'edit', usage: 'Edit, configuration', size: 'sm-md' },
  { icon: 'chevronRight', usage: 'Navigate forward, expand', size: 'xs-sm' },
  { icon: 'chevronDown', usage: 'Expand, dropdown', size: 'xs-sm' },
  { icon: 'plus', usage: 'Add, create new', size: 'sm-md' },
  { icon: 'moreHorizontal', usage: 'More options menu', size: 'sm' },
] as const;

export function SectionContentGuidelines(): React.ReactElement {
  return (
    <FieldsetSection title="20. content & writing" id="content-guidelines">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Consistent language and terminology across the platform.
        These guidelines ensure clarity for users and maintainability for developers.
      </p>

      <SubSection title="glossary">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Use these terms consistently throughout the platform.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>term</TableHead>
                <TableHead>definition</TableHead>
                <TableHead>avoid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glossaryTerms.map((item) => (
                <TableRow key={item.term}>
                  <TableCell className="font-mono text-sm font-medium">{item.term}</TableCell>
                  <TableCell className="text-sm text-foreground-secondary">{item.definition}</TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground-tertiary line-through">{item.avoid}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SubSection>

      <SubSection title="verb consistency">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Use these verbs for common actions to maintain consistency.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>action</TableHead>
                <TableHead>use</TableHead>
                <TableHead>avoid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verbConsistency.map((item) => (
                <TableRow key={item.action}>
                  <TableCell className="text-sm text-foreground-secondary">{item.action}</TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">{item.use}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground-tertiary line-through">{item.avoid}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SubSection>

      <SubSection title="capitalization">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Follow these capitalization rules for UI text.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoDontCard type="do" title="Lowercase for UI elements">
            <div className="space-y-2 text-sm font-mono">
              <div className="p-2 bg-surface-2">create tool</div>
              <div className="p-2 bg-surface-2">view details</div>
              <div className="p-2 bg-surface-2">my collections</div>
            </div>
          </DoDontCard>
          <DoDontCard type="dont" title="Avoid title case in buttons">
            <div className="space-y-2 text-sm font-mono">
              <div className="p-2 bg-surface-2">Create Tool</div>
              <div className="p-2 bg-surface-2">View Details</div>
              <div className="p-2 bg-surface-2">My Collections</div>
            </div>
          </DoDontCard>
        </div>
        <div className="mt-4 bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-3">exceptions</h4>
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• Proper nouns: "GitHub", "Anthropic", "Claude"</li>
            <li>• Product names: "TPMJS", "MCP"</li>
            <li>• Start of sentences in paragraphs</li>
          </ul>
        </div>
      </SubSection>

      <SubSection title="numbers & formatting">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Format numbers and data consistently.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-xs text-foreground-tertiary mb-3">numbers</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Small:</span>
                <span className="font-mono">1, 42, 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Large:</span>
                <span className="font-mono">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Abbreviated:</span>
                <span className="font-mono">12.5k, 1.2M</span>
              </div>
            </div>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-xs text-foreground-tertiary mb-3">dates</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Full:</span>
                <span className="font-mono">Jan 15, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Relative:</span>
                <span className="font-mono">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">ISO:</span>
                <span className="font-mono">2025-01-15</span>
              </div>
            </div>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-xs text-foreground-tertiary mb-3">units</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Bytes:</span>
                <span className="font-mono">2.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Duration:</span>
                <span className="font-mono">3m 24s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Version:</span>
                <span className="font-mono">v1.2.3</span>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="error messages">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Write error messages that are helpful and actionable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoDontCard type="do" title="Helpful and specific">
            <div className="space-y-3">
              <div className="p-3 bg-error-light border-l-2 border-error text-sm">
                <p className="font-medium">Invalid email format</p>
                <p className="text-foreground-secondary text-xs mt-1">Please enter a valid email address like user@example.com</p>
              </div>
              <div className="p-3 bg-error-light border-l-2 border-error text-sm">
                <p className="font-medium">Tool name already exists</p>
                <p className="text-foreground-secondary text-xs mt-1">Choose a different name or update the existing tool</p>
              </div>
            </div>
          </DoDontCard>
          <DoDontCard type="dont" title="Vague or technical">
            <div className="space-y-3">
              <div className="p-3 bg-error-light border-l-2 border-error text-sm">
                <p className="font-medium">Invalid input</p>
              </div>
              <div className="p-3 bg-error-light border-l-2 border-error text-sm">
                <p className="font-medium">Error: EEXIST</p>
              </div>
              <div className="p-3 bg-error-light border-l-2 border-error text-sm">
                <p className="font-medium">Something went wrong</p>
              </div>
            </div>
          </DoDontCard>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

export function SectionIconSystem(): React.ReactElement {
  return (
    <FieldsetSection title="21. icon system" id="icon-system">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Icons from Lucide React, used consistently across components.
        All icons use 2px stroke weight and are available in multiple sizes.
      </p>

      <SubSection title="icon library">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Source: <a href="https://lucide.dev" className="text-accent hover:underline">Lucide React</a>.
          Icons should be imported from <code className="text-xs bg-surface-2 px-1">@tpmjs/ui/Icon/Icon</code>.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-4">common icons</h4>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {iconUsageRules.map((item) => (
              <div key={item.icon} className="flex flex-col items-center gap-2 p-3 bg-surface-2">
                <Icon icon={item.icon} size="md" />
                <span className="font-mono text-[10px] text-foreground-tertiary">{item.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      <SubSection title="icon sizes">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Choose icon size based on context and surrounding content.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <Icon icon="edit" size="xs" className="mx-auto" />
            <p className="font-mono text-xs mt-2">xs (12px)</p>
            <p className="text-[10px] text-foreground-tertiary mt-1">Inline, tight spaces</p>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <Icon icon="edit" size="sm" className="mx-auto" />
            <p className="font-mono text-xs mt-2">sm (16px)</p>
            <p className="text-[10px] text-foreground-tertiary mt-1">Buttons, inputs</p>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <Icon icon="edit" size="md" className="mx-auto" />
            <p className="font-mono text-xs mt-2">md (20px)</p>
            <p className="text-[10px] text-foreground-tertiary mt-1">Default, nav items</p>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <Icon icon="edit" size="lg" className="mx-auto" />
            <p className="font-mono text-xs mt-2">lg (24px)</p>
            <p className="text-[10px] text-foreground-tertiary mt-1">Empty states, hero</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="icon usage guidelines">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          When and how to use specific icons.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>icon</TableHead>
                <TableHead>usage</TableHead>
                <TableHead>recommended size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {iconUsageRules.map((item) => (
                <TableRow key={item.icon}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon={item.icon} size="sm" />
                      <code className="text-xs">{item.icon}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground-secondary">{item.usage}</TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">{item.size}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SubSection>

      <SubSection title="icon styling">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Consistent styling rules for icons in different contexts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">colors</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon icon="check" size="sm" className="text-success" />
                <span className="text-sm text-foreground-secondary">Success states</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="alertCircle" size="sm" className="text-error" />
                <span className="text-sm text-foreground-secondary">Error states</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="alertTriangle" size="sm" className="text-warning" />
                <span className="text-sm text-foreground-secondary">Warning states</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="info" size="sm" className="text-accent" />
                <span className="text-sm text-foreground-secondary">Information</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="edit" size="sm" className="text-foreground-secondary" />
                <span className="text-sm text-foreground-secondary">Neutral/default</span>
              </div>
            </div>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">with text</h4>
            <div className="space-y-3">
              <button className="flex items-center gap-2 px-3 py-2 bg-accent text-white">
                <Icon icon="plus" size="sm" />
                <span className="font-mono text-sm">create tool</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-border">
                <span className="font-mono text-sm">settings</span>
                <Icon icon="chevronRight" size="xs" />
              </button>
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Icon icon="clock" size="xs" />
                <span className="text-xs">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="adding new icons">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Process for adding new icons to the system.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <ol className="space-y-3 text-sm text-foreground-secondary font-sans">
            <li className="flex gap-3">
              <span className="font-mono text-accent">1.</span>
              Check if a suitable icon exists in <a href="https://lucide.dev/icons" className="text-accent hover:underline">Lucide</a>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">2.</span>
              Add the icon import to <code className="text-xs bg-surface-2 px-1">packages/ui/src/Icon/icons.ts</code>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">3.</span>
              Add the icon name to the <code className="text-xs bg-surface-2 px-1">IconName</code> type
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">4.</span>
              Document the usage in this style guide
            </li>
          </ol>
          <div className="mt-4 p-3 bg-surface-2">
            <p className="font-mono text-xs text-foreground-tertiary mb-2">example: adding a new icon</p>
            <pre className="text-xs font-mono overflow-x-auto">
{`// icons.ts
import { Heart } from 'lucide-react';

export const icons = {
  // ...existing icons
  heart: Heart,
};

export type IconName = keyof typeof icons;`}
            </pre>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

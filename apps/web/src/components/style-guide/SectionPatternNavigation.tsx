/* eslint-disable jsx-a11y/anchor-is-valid -- style guide demo anchors use href="#" intentionally */
'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Breadcrumbs,
} from '@tpmjs/ui/Breadcrumbs/Breadcrumbs';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import { useState } from 'react';
import { FieldsetSection, Kbd, RuleBox, SubSection } from './shared';

export function SectionPatternNavigation(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <FieldsetSection title="14. navigation patterns" id="nav-patterns">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Navigation patterns for consistent wayfinding across the platform. Each pattern has specific
        use cases and accessibility requirements.
      </p>

      <SubSection title="global navigation (header)">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          The primary header navigation appears on every page and provides access to main sections.
        </p>
        <div className="bg-surface border border-dashed border-border">
          {/* Mock header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-8">
              <span className="font-mono text-lg font-semibold">tpmjs</span>
              <nav className="flex items-center gap-6">
                <a
                  href="#"
                  className="font-mono text-sm text-foreground hover:text-accent transition-colors"
                >
                  tools
                </a>
                <a
                  href="#"
                  className="font-mono text-sm text-foreground-secondary hover:text-accent transition-colors"
                >
                  agents
                </a>
                <a
                  href="#"
                  className="font-mono text-sm text-foreground-secondary hover:text-accent transition-colors"
                >
                  docs
                </a>
                <a
                  href="#"
                  className="font-mono text-sm text-foreground-secondary hover:text-accent transition-colors"
                >
                  pricing
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                sign in
              </Button>
              <Button size="sm">get started</Button>
            </div>
          </div>
        </div>
        <RuleBox title="guidelines">
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• Maximum 5-6 top-level items to avoid cognitive overload</li>
            <li>• Use visible active states (underline or background)</li>
            <li>• Logo always links to home</li>
            <li>• Auth actions stay in top-right corner</li>
          </ul>
        </RuleBox>
      </SubSection>

      <SubSection title="sidebar navigation">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Vertical sidebar for section-level navigation within the app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expanded sidebar */}
          <div className="bg-surface border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">expanded state</p>
            <nav className="space-y-1">
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 bg-accent/10 text-accent font-mono text-sm"
              >
                <Icon icon="home" size="sm" />
                <span>dashboard</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 text-foreground-secondary hover:bg-surface-2 font-mono text-sm"
              >
                <Icon icon="puzzle" size="sm" />
                <span>tools</span>
                <Badge size="sm" variant="outline" className="ml-auto">
                  12
                </Badge>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 text-foreground-secondary hover:bg-surface-2 font-mono text-sm"
              >
                <Icon icon="key" size="sm" />
                <span>api keys</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 text-foreground-secondary hover:bg-surface-2 font-mono text-sm"
              >
                <Icon icon="user" size="sm" />
                <span>settings</span>
              </a>
            </nav>
          </div>

          {/* Collapsed sidebar */}
          <div className="bg-surface border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">collapsed state</p>
            <nav className="flex flex-col items-center space-y-2">
              <button className="p-3 bg-accent/10 text-accent" title="Dashboard">
                <Icon icon="home" size="sm" />
              </button>
              <button className="p-3 text-foreground-secondary hover:bg-surface-2" title="Tools">
                <Icon icon="puzzle" size="sm" />
              </button>
              <button className="p-3 text-foreground-secondary hover:bg-surface-2" title="API Keys">
                <Icon icon="key" size="sm" />
              </button>
              <button className="p-3 text-foreground-secondary hover:bg-surface-2" title="Settings">
                <Icon icon="user" size="sm" />
              </button>
            </nav>
          </div>
        </div>
        <RuleBox title="keyboard shortcuts">
          <div className="grid grid-cols-2 gap-4 text-sm text-foreground-secondary font-sans">
            <div>
              <Kbd>[</Kbd> collapse/expand sidebar
            </div>
            <div>
              <Kbd>g then h</Kbd> go to home
            </div>
            <div>
              <Kbd>g then t</Kbd> go to tools
            </div>
            <div>
              <Kbd>g then s</Kbd> go to settings
            </div>
          </div>
        </RuleBox>
      </SubSection>

      <SubSection title="breadcrumbs">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Show hierarchical location and enable navigation back to parent pages.
        </p>
        <div className="space-y-4">
          {/* Simple breadcrumb */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">default</p>
            <Breadcrumbs>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">tools</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>@tpmjs/parser</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumbs>
          </div>

          {/* With icons */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">with icons</p>
            <Breadcrumbs>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="flex items-center gap-1">
                  <Icon icon="home" size="xs" />
                  <span>home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="flex items-center gap-1">
                  <Icon icon="folder" size="xs" />
                  <span>projects</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>my-tool</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumbs>
          </div>
        </div>
      </SubSection>

      <SubSection title="tab navigation">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          For switching between views within a page context.
        </p>
        <div className="space-y-4">
          <div className="bg-surface p-4 border border-dashed border-border">
            <Tabs
              tabs={[
                { id: 'overview', label: 'overview' },
                { id: 'readme', label: 'readme' },
                { id: 'versions', label: 'versions', count: 24 },
                { id: 'dependencies', label: 'dependencies', count: 3 },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="default"
            />
          </div>

          <RuleBox title="keyboard behavior">
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>
                • <Kbd>←</Kbd> / <Kbd>→</Kbd> navigate between tabs
              </li>
              <li>
                • <Kbd>Home</Kbd> focus first tab
              </li>
              <li>
                • <Kbd>End</Kbd> focus last tab
              </li>
              <li>
                • <Kbd>Enter</Kbd> / <Kbd>Space</Kbd> activate focused tab
              </li>
            </ul>
          </RuleBox>
        </div>
      </SubSection>

      <SubSection title="mobile navigation">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Hamburger menu pattern for narrow viewports.
        </p>
        <div className="max-w-sm">
          <div className="bg-surface border border-dashed border-border">
            {/* Mock mobile header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-mono text-sm font-semibold">tpmjs</span>
              <Button variant="ghost" size="icon">
                <Icon icon="menu" size="sm" />
              </Button>
            </div>
            {/* Expanded menu preview */}
            <div className="p-4 space-y-2">
              <a
                href="#"
                className="block px-3 py-2 font-mono text-sm text-foreground bg-accent/10"
              >
                tools
              </a>
              <a href="#" className="block px-3 py-2 font-mono text-sm text-foreground-secondary">
                agents
              </a>
              <a href="#" className="block px-3 py-2 font-mono text-sm text-foreground-secondary">
                docs
              </a>
              <a href="#" className="block px-3 py-2 font-mono text-sm text-foreground-secondary">
                pricing
              </a>
              <div className="pt-4 border-t border-border space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  sign in
                </Button>
                <Button size="sm" className="w-full">
                  get started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

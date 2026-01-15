'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Select } from '@tpmjs/ui/Select/Select';
import { FieldsetSection, SubSection } from './shared';

export function SectionPatternSearch(): React.ReactElement {
  return (
    <FieldsetSection title="18. search & filtering" id="search-patterns">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Search and filter patterns help users find content quickly.
        Design for progressive disclosure and instant feedback.
      </p>

      <SubSection title="search box states">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Search boxes should show clear states and provide helpful feedback.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default state */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">default</p>
            <div className="relative">
              <Icon icon="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <Input placeholder="search tools..." className="pl-10" />
            </div>
          </div>

          {/* Active state */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">active / has value</p>
            <div className="relative">
              <Icon icon="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <Input defaultValue="parser" className="pl-10 pr-10" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground">
                <Icon icon="x" size="sm" />
              </button>
            </div>
          </div>

          {/* Loading state */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">loading</p>
            <div className="relative">
              <Icon icon="loader" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary animate-spin" />
              <Input defaultValue="validator" className="pl-10" readOnly />
            </div>
          </div>

          {/* No results state */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-3">no results</p>
            <div className="relative">
              <Icon icon="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <Input defaultValue="xyzabc123" className="pl-10 pr-10" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground">
                <Icon icon="x" size="sm" />
              </button>
            </div>
            <p className="text-xs text-foreground-tertiary mt-2">No results found</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="filter chips">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Use chips to show active filters with easy removal.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="default" className="pr-1 flex items-center gap-1">
              category: utility
              <button className="ml-1 hover:bg-accent-strong rounded">
                <Icon icon="x" size="xs" />
              </button>
            </Badge>
            <Badge variant="default" className="pr-1 flex items-center gap-1">
              status: active
              <button className="ml-1 hover:bg-accent-strong rounded">
                <Icon icon="x" size="xs" />
              </button>
            </Badge>
            <Badge variant="default" className="pr-1 flex items-center gap-1">
              downloads: &gt;10k
              <button className="ml-1 hover:bg-accent-strong rounded">
                <Icon icon="x" size="xs" />
              </button>
            </Badge>
            <button className="font-mono text-xs text-accent hover:underline">clear all</button>
          </div>
          <p className="font-mono text-xs text-foreground-secondary">
            showing 42 of 128 tools
          </p>
        </div>
      </SubSection>

      <SubSection title="filter panel">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          For complex filtering, use a dedicated panel with grouped options.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Filter panel */}
          <div className="bg-surface border border-dashed border-border p-4">
            <h4 className="font-mono text-sm font-medium mb-4">filters</h4>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-foreground-secondary block mb-2">category</label>
                <Select
                  placeholder="all categories"
                  options={[
                    { value: 'utility', label: 'Utility' },
                    { value: 'validation', label: 'Validation' },
                    { value: 'data', label: 'Data' },
                  ]}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-foreground-secondary block mb-2">status</label>
                <Select
                  placeholder="all statuses"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'beta', label: 'Beta' },
                    { value: 'deprecated', label: 'Deprecated' },
                  ]}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-foreground-secondary block mb-2">min downloads</label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="pt-4 border-t border-dashed border-border">
                <Button size="sm" className="w-full">apply filters</Button>
              </div>
            </div>
          </div>

          {/* Results preview */}
          <div className="md:col-span-2 bg-surface border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">results area</p>
            <div className="space-y-2">
              {['@tpmjs/parser', '@tpmjs/validator', '@tpmjs/transform'].map((name) => (
                <div key={name} className="p-3 border border-dashed border-border flex items-center justify-between">
                  <span className="font-mono text-sm">{name}</span>
                  <Badge variant="success" size="sm">active</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="saved views">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Allow users to save and recall filter combinations.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">saved views</span>
              <Badge variant="outline" size="sm">3</Badge>
            </div>
            <Button size="sm" variant="ghost">
              <Icon icon="plus" size="sm" className="mr-2" />
              save current
            </Button>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-accent/10 font-mono text-sm flex items-center justify-between">
              <span>my active tools</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">42 results</Badge>
                <Icon icon="check" size="sm" className="text-accent" />
              </div>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-surface-2 font-mono text-sm flex items-center justify-between">
              <span>deprecated packages</span>
              <Badge variant="outline" size="sm">8 results</Badge>
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-surface-2 font-mono text-sm flex items-center justify-between">
              <span>high-download tools</span>
              <Badge variant="outline" size="sm">15 results</Badge>
            </button>
          </div>
        </div>
      </SubSection>

      <SubSection title="query syntax display">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          For power users, display the underlying query syntax.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-medium">query</span>
            <button className="font-mono text-xs text-accent hover:underline flex items-center gap-1">
              <Icon icon="copy" size="xs" />
              copy
            </button>
          </div>
          <div className="bg-surface-2 p-3 font-mono text-xs">
            <span className="text-accent">category:</span>
            <span className="text-foreground">utility</span>
            <span className="text-foreground-tertiary"> AND </span>
            <span className="text-accent">status:</span>
            <span className="text-foreground">active</span>
            <span className="text-foreground-tertiary"> AND </span>
            <span className="text-accent">downloads:</span>
            <span className="text-foreground">&gt;10000</span>
          </div>
          <p className="font-sans text-xs text-foreground-tertiary mt-3">
            Tip: Use this syntax directly in the search box for quick filtering.
          </p>
        </div>
      </SubSection>

      <SubSection title="command palette">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Quick access to search and navigation via keyboard shortcut.
        </p>
        <div className="max-w-md mx-auto">
          <div className="bg-surface border border-border shadow-lg">
            {/* Search input */}
            <div className="border-b border-border p-3">
              <div className="relative">
                <Icon icon="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
                <Input placeholder="search or type a command..." className="pl-10 border-0 focus:ring-0" />
              </div>
            </div>

            {/* Results groups */}
            <div className="max-h-80 overflow-y-auto">
              {/* Recent */}
              <div className="p-2">
                <p className="font-mono text-[10px] text-foreground-tertiary uppercase tracking-wide px-2 py-1">recent</p>
                <button className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center gap-3">
                  <Icon icon="clock" size="sm" className="text-foreground-tertiary" />
                  <span className="font-mono text-sm">@tpmjs/parser</span>
                </button>
              </div>

              {/* Actions */}
              <div className="p-2 border-t border-border">
                <p className="font-mono text-[10px] text-foreground-tertiary uppercase tracking-wide px-2 py-1">actions</p>
                <button className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon icon="plus" size="sm" className="text-foreground-tertiary" />
                    <span className="font-mono text-sm">create new tool</span>
                  </div>
                  <kbd className="font-mono text-[10px] bg-surface-2 px-2 py-0.5">⌘N</kbd>
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon icon="home" size="sm" className="text-foreground-tertiary" />
                    <span className="font-mono text-sm">go to dashboard</span>
                  </div>
                  <kbd className="font-mono text-[10px] bg-surface-2 px-2 py-0.5">⌘D</kbd>
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon icon="user" size="sm" className="text-foreground-tertiary" />
                    <span className="font-mono text-sm">go to settings</span>
                  </div>
                  <kbd className="font-mono text-[10px] bg-surface-2 px-2 py-0.5">⌘,</kbd>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-foreground-tertiary">
              <div className="flex items-center gap-3">
                <span><kbd className="bg-surface-2 px-1.5 py-0.5">↑↓</kbd> navigate</span>
                <span><kbd className="bg-surface-2 px-1.5 py-0.5">↵</kbd> select</span>
                <span><kbd className="bg-surface-2 px-1.5 py-0.5">esc</kbd> close</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <kbd className="font-mono text-xs bg-surface px-3 py-1.5 border border-border">⌘K</kbd>
          <span className="font-sans text-xs text-foreground-secondary ml-2">to open command palette</span>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

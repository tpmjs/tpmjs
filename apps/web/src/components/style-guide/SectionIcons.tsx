'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { FieldsetSection, SubSection } from './shared';

export function SectionIcons(): React.ReactElement {
  return (
    <FieldsetSection title="10. iconography" id="icons">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Consistent icon usage for clear visual communication.
      </p>

      <SubSection title="icon sizes">
        <div className="flex flex-wrap gap-8 items-end mb-8">
          <div className="text-center">
            <Icon icon="github" size="xs" />
            <p className="font-mono text-xs text-foreground-secondary mt-3">xs (12px)</p>
          </div>
          <div className="text-center">
            <Icon icon="github" size="sm" />
            <p className="font-mono text-xs text-foreground-secondary mt-3">sm (16px)</p>
          </div>
          <div className="text-center">
            <Icon icon="github" size="md" />
            <p className="font-mono text-xs text-foreground-secondary mt-3">md (20px)</p>
          </div>
          <div className="text-center">
            <Icon icon="github" size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-3">lg (24px)</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="usage rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">icon-only buttons</h4>
            <p className="font-sans text-sm text-foreground-secondary mb-4">
              Only allowed when the action is universally understood
              (close, search, menu) AND space is limited.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost"><Icon icon="x" size="sm" /></Button>
              <Button size="icon" variant="ghost"><Icon icon="search" size="sm" /></Button>
              <Button size="icon" variant="ghost"><Icon icon="menu" size="sm" /></Button>
            </div>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">icon + label (preferred)</h4>
            <p className="font-sans text-sm text-foreground-secondary mb-4">
              Always include text labels when space permits for clarity.
            </p>
            <div className="flex gap-2">
              <Button size="sm"><Icon icon="plus" size="sm" className="mr-2" /> add tool</Button>
              <Button size="sm" variant="outline"><Icon icon="upload" size="sm" className="mr-2" /> upload</Button>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="semantic icons">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface p-4 border border-dashed border-border flex items-center gap-3">
            <Icon icon="check" size="md" className="text-success" />
            <span className="font-mono text-sm">success</span>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border flex items-center gap-3">
            <Icon icon="alertCircle" size="md" className="text-warning" />
            <span className="font-mono text-sm">warning</span>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border flex items-center gap-3">
            <Icon icon="x" size="md" className="text-error" />
            <span className="font-mono text-sm">error</span>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border flex items-center gap-3">
            <Icon icon="info" size="md" className="text-info" />
            <span className="font-mono text-sm">info</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="all icons">
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-6">
          {[
            'copy', 'github', 'check', 'x', 'chevronDown', 'chevronRight',
            'clock', 'link', 'sun', 'moon', 'discord', 'menu',
            'folder', 'plus', 'trash', 'edit', 'search', 'loader',
            'upload', 'alertCircle', 'globe', 'terminal', 'puzzle', 'message',
            'key', 'info', 'send', 'home', 'user', 'heart',
            'star', 'externalLink', 'arrowLeft', 'box', 'alertTriangle',
          ].map((iconName) => (
            <div key={iconName} className="flex flex-col items-center gap-2" title={iconName}>
              <Icon icon={iconName as Parameters<typeof Icon>[0]['icon']} size="md" className="text-foreground" />
              <span className="font-mono text-[10px] text-foreground-tertiary truncate max-w-full">{iconName}</span>
            </div>
          ))}
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

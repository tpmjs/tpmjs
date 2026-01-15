'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { DoDontCard, FieldsetSection, SubSection } from './shared';

export function SectionAccessibility(): React.ReactElement {
  return (
    <FieldsetSection title="6. accessibility" id="accessibility">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        TPMJS targets WCAG 2.1 AA compliance. Accessibility is not optional—it's
        a core requirement for every component.
      </p>

      <SubSection title="standards">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface p-6 border border-dashed border-border text-center">
            <p className="font-mono text-4xl font-bold text-accent mb-2">AA</p>
            <p className="font-mono text-sm text-foreground-secondary">WCAG 2.1 target</p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border text-center">
            <p className="font-mono text-4xl font-bold text-foreground mb-2">4.5:1</p>
            <p className="font-mono text-sm text-foreground-secondary">min contrast (text)</p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border text-center">
            <p className="font-mono text-4xl font-bold text-foreground mb-2">3:1</p>
            <p className="font-mono text-sm text-foreground-secondary">min contrast (UI)</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="focus management">
        <div className="space-y-6">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">focus ring design</h4>
            <p className="font-sans text-sm text-foreground-secondary mb-4">
              Focus rings use the copper accent color with 2px width and 2px offset.
              They are <strong>never removed</strong> from interactive elements.
            </p>
            <div className="flex gap-4">
              <Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                tab to me
              </Button>
              <Input placeholder="or me" className="max-w-xs" />
            </div>
          </div>

          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">keyboard navigation</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• <kbd className="px-2 py-1 bg-surface-2 font-mono text-xs">Tab</kbd> moves focus forward through interactive elements</li>
              <li>• <kbd className="px-2 py-1 bg-surface-2 font-mono text-xs">Shift+Tab</kbd> moves focus backward</li>
              <li>• <kbd className="px-2 py-1 bg-surface-2 font-mono text-xs">Enter</kbd> / <kbd className="px-2 py-1 bg-surface-2 font-mono text-xs">Space</kbd> activates buttons and links</li>
              <li>• <kbd className="px-2 py-1 bg-surface-2 font-mono text-xs">Esc</kbd> closes modals and dropdowns</li>
              <li>• Arrow keys navigate within components (tabs, radios, menus)</li>
            </ul>
          </div>
        </div>
      </SubSection>

      <SubSection title="color independence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoDontCard type="do" title="Use icons + color for states">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 text-success">
                <Icon icon="check" size="sm" />
                <span className="text-sm">Published</span>
              </div>
              <div className="flex items-center gap-2 text-error">
                <Icon icon="x" size="sm" />
                <span className="text-sm">Failed</span>
              </div>
            </div>
          </DoDontCard>
          <DoDontCard type="dont" title="Don't rely on color alone">
            <div className="flex gap-4 items-center">
              <span className="text-sm text-success">Published</span>
              <span className="text-sm text-error">Failed</span>
            </div>
          </DoDontCard>
        </div>
      </SubSection>

      <SubSection title="screen reader support">
        <div className="bg-surface p-6 border border-dashed border-border">
          <ul className="space-y-3 text-sm text-foreground-secondary font-sans">
            <li>• All interactive elements have accessible names (aria-label or visible text)</li>
            <li>• Images include alt text describing content</li>
            <li>• Form inputs are associated with labels</li>
            <li>• Error messages are announced via aria-live regions</li>
            <li>• Loading states communicate progress to screen readers</li>
            <li>• Decorative elements are hidden from assistive technology</li>
          </ul>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { FieldsetSection, SubSection } from './shared';

export function SectionTheming(): React.ReactElement {
  return (
    <FieldsetSection title="11. theming" id="theming">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Theme architecture and customization guidelines for consistent extension.
      </p>

      <SubSection title="token architecture">
        <div className="bg-surface p-6 border border-dashed border-border mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">core</Badge>
              <span className="font-mono text-sm text-foreground-secondary">
                Raw values: HSL colors, pixel sizes, timing functions
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">semantic</Badge>
              <span className="font-mono text-sm text-foreground-secondary">
                Named tokens: --primary, --background, --motion-fast
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">component</Badge>
              <span className="font-mono text-sm text-foreground-secondary">
                Component-specific: button-bg, input-border, card-shadow
              </span>
            </div>
          </div>
        </div>

        <CodeBlock
          code={`/* Core tokens (don't override) */
--copper-500: 22 57% 41%;

/* Semantic tokens (safe to override) */
--primary: var(--copper-500);
--primary-hover: 22 57% 35%;
--accent: var(--primary);

/* Component tokens (for advanced customization) */
--button-bg: hsl(var(--primary));
--button-hover-bg: hsl(var(--primary-hover));`}
          language="css"
        />
      </SubSection>

      <SubSection title="dark mode">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Dark mode is opt-in via the <code className="font-mono bg-surface px-1">.dark</code> class
          on the root element. All semantic tokens have dark mode variants.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background p-6 border border-dashed border-border">
            <p className="font-mono text-sm mb-4">light mode</p>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-background border border-border" />
              <div className="w-8 h-8 bg-surface border border-border" />
              <div className="w-8 h-8 bg-accent" />
              <div className="w-8 h-8 bg-foreground" />
            </div>
          </div>
          <div className="bg-[#0F0E0D] p-6 border border-[#363230]">
            <p className="font-mono text-sm text-[#E8E5E2] mb-4">dark mode</p>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-[#0F0E0D] border border-[#363230]" />
              <div className="w-8 h-8 bg-[#171514] border border-[#363230]" />
              <div className="w-8 h-8 bg-[#C96A38]" />
              <div className="w-8 h-8 bg-[#E8E5E2]" />
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="embedding guidance">
        <div className="bg-surface p-6 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-4">for sdk users embedding tpmjs ui</h4>
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• Import the CSS variables from <code className="font-mono bg-surface-2 px-1">@tpmjs/ui/styles</code></li>
            <li>• Override semantic tokens in your own CSS to match your brand</li>
            <li>• Do not override core tokens (raw values)</li>
            <li>• Test both light and dark modes if supporting theme switching</li>
            <li>• Use <code className="font-mono bg-surface-2 px-1">data-density</code> attribute for density control</li>
          </ul>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

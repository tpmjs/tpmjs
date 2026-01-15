'use client';

import { FieldsetSection, SubSection, TokenRow } from './shared';

export function SectionTypography(): React.ReactElement {
  return (
    <FieldsetSection title="3. typography" id="typography">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Two font families create clear hierarchy: monospace for headings and technical
        content, sans-serif for body text and descriptions.
      </p>

      <SubSection title="font families">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface p-6 border border-dashed border-border">
            <p className="font-mono text-2xl mb-2">JetBrains Mono</p>
            <p className="font-mono text-sm text-foreground-secondary mb-4">--font-mono</p>
            <p className="font-mono text-sm">Used for: headings, code, data, labels, technical content</p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <p className="font-sans text-2xl mb-2">Inter</p>
            <p className="font-mono text-sm text-foreground-secondary mb-4">--font-sans</p>
            <p className="font-sans text-sm">Used for: body text, descriptions, long-form content</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="type scale">
        <div className="space-y-4">
          <TokenRow name="--text-xs" value="12px / 0.75rem" preview={<span className="text-xs font-mono">Aa</span>} />
          <TokenRow name="--text-sm" value="14px / 0.875rem" preview={<span className="text-sm font-mono">Aa</span>} />
          <TokenRow name="--text-base" value="16px / 1rem" preview={<span className="text-base font-mono">Aa</span>} />
          <TokenRow name="--text-lg" value="18px / 1.125rem" preview={<span className="text-lg font-mono">Aa</span>} />
          <TokenRow name="--text-xl" value="20px / 1.25rem" preview={<span className="text-xl font-mono">Aa</span>} />
          <TokenRow name="--text-2xl" value="24px / 1.5rem" preview={<span className="text-2xl font-mono">Aa</span>} />
          <TokenRow name="--text-3xl" value="32px / 2rem" preview={<span className="text-3xl font-mono">Aa</span>} />
          <TokenRow name="--text-4xl" value="40px / 2.5rem" preview={<span className="text-4xl font-mono">Aa</span>} />
          <TokenRow name="--text-5xl" value="48px / 3rem" preview={<span className="text-5xl font-mono">Aa</span>} />
        </div>
      </SubSection>

      <SubSection title="line height">
        <div className="space-y-4">
          <TokenRow name="--leading-tight" value="1.2" preview={<div className="w-full h-3 bg-accent/20" />} />
          <TokenRow name="--leading-snug" value="1.4" preview={<div className="w-full h-4 bg-accent/20" />} />
          <TokenRow name="--leading-normal" value="1.6" preview={<div className="w-full h-5 bg-accent/20" />} />
          <TokenRow name="--leading-relaxed" value="1.7" preview={<div className="w-full h-6 bg-accent/20" />} />
          <TokenRow name="--leading-loose" value="1.8" preview={<div className="w-full h-7 bg-accent/20" />} />
        </div>
      </SubSection>

      <SubSection title="max line width">
        <div className="space-y-4 mb-8">
          <TokenRow name="--prose-width-narrow" value="45ch" />
          <TokenRow name="--prose-width" value="65ch (default)" />
          <TokenRow name="--prose-width-wide" value="80ch" />
        </div>
        <div className="bg-surface p-6 border border-dashed border-border">
          <p className="font-sans text-sm text-foreground-secondary leading-relaxed prose-width">
            This paragraph is constrained to 65 characters per line, the optimal width
            for reading comprehension. Lines that are too long cause eye fatigue, while
            lines that are too short disrupt reading rhythm.
          </p>
        </div>
      </SubSection>

      <SubSection title="usage rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">monospace (JetBrains Mono)</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• Page titles and section headings</li>
              <li>• Code snippets and technical content</li>
              <li>• Data values, metrics, timestamps</li>
              <li>• Form labels and button text</li>
              <li>• Table headers and numeric columns</li>
            </ul>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">sans-serif (Inter)</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• Body paragraphs and descriptions</li>
              <li>• Help text and instructions</li>
              <li>• Error messages and notifications</li>
              <li>• Marketing and explanatory content</li>
              <li>• Long-form documentation</li>
            </ul>
          </div>
        </div>
      </SubSection>

      <SubSection title="heading hierarchy">
        <div className="space-y-6">
          <h1 className="font-mono text-5xl font-semibold tracking-tight lowercase">heading 1 (48px)</h1>
          <h2 className="font-mono text-4xl font-semibold tracking-tight lowercase">heading 2 (40px)</h2>
          <h3 className="font-mono text-3xl font-semibold tracking-tight lowercase">heading 3 (32px)</h3>
          <h4 className="font-mono text-2xl font-semibold tracking-tight lowercase">heading 4 (24px)</h4>
          <h5 className="font-mono text-xl font-medium lowercase">heading 5 (20px)</h5>
          <h6 className="font-mono text-lg font-medium lowercase">heading 6 (18px)</h6>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

'use client';

import { FieldsetSection, SubSection, TokenRow } from './shared';

export function SectionSpacing(): React.ReactElement {
  return (
    <FieldsetSection title="4. spacing" id="spacing">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Consistent spacing creates visual rhythm. Use the 4px base unit
        and generous whitespace for clarity.
      </p>

      <SubSection title="spacing scale">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64].map((space) => (
            <div key={space} className="flex items-center gap-4">
              <span className="font-mono text-xs text-foreground-secondary w-12">{space}</span>
              <div
                className="bg-accent h-4"
                style={{ width: `${space * 4}px` }}
              />
              <span className="font-mono text-xs text-foreground-tertiary">{space * 4}px</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="semantic spacing">
        <div className="space-y-4">
          <TokenRow name="--spacing-tight" value="16px (4)" />
          <TokenRow name="--spacing-element" value="32px (8)" />
          <TokenRow name="--spacing-comfortable" value="48px (12)" />
          <TokenRow name="--spacing-component" value="64px (16)" />
          <TokenRow name="--spacing-section" value="128px (32)" />
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

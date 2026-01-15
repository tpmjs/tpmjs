'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { FieldsetSection, SubSection, TokenRow } from './shared';

export function SectionMotion(): React.ReactElement {
  return (
    <FieldsetSection title="5. motion" id="motion">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Motion communicates state changes, not decoration. Animations are fast
        by default and respect user preferences.
      </p>

      <SubSection title="motion principles">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">fast by default</h4>
            <p className="font-sans text-sm text-foreground-secondary">
              Most transitions complete in 150-200ms. Users should never wait
              for animations to finish before interacting.
            </p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">state communication</h4>
            <p className="font-sans text-sm text-foreground-secondary">
              Motion indicates something changed: a panel opened, an item was
              selected, data updated. Never animate just for visual interest.
            </p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">linear for data</h4>
            <p className="font-sans text-sm text-foreground-secondary">
              Data updates (counters, progress bars, charts) use linear easing.
              This feels more precise and mechanical.
            </p>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">respect preferences</h4>
            <p className="font-sans text-sm text-foreground-secondary">
              Honor prefers-reduced-motion. All animations disable when the
              user has requested reduced motion.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection title="duration tokens">
        <div className="space-y-4">
          <TokenRow name="--motion-instant" value="0ms" preview={<div className="w-full h-2 bg-accent" />} />
          <TokenRow name="--motion-fast" value="150ms" preview={<div className="w-full h-2 bg-accent motion-fast" />} />
          <TokenRow name="--motion-base" value="200ms" preview={<div className="w-full h-2 bg-accent motion-base" />} />
          <TokenRow name="--motion-slow" value="300ms" preview={<div className="w-full h-2 bg-accent motion-slow" />} />
          <TokenRow name="--motion-slower" value="500ms" preview={<div className="w-full h-2 bg-accent" />} />
        </div>
      </SubSection>

      <SubSection title="easing tokens">
        <div className="space-y-4">
          <TokenRow name="--easing-standard" value="cubic-bezier(0.4, 0, 0.2, 1)" />
          <TokenRow name="--easing-decelerate" value="cubic-bezier(0, 0, 0.2, 1)" />
          <TokenRow name="--easing-accelerate" value="cubic-bezier(0.4, 0, 1, 1)" />
          <TokenRow name="--easing-linear" value="linear" />
          <TokenRow name="--easing-spring" value="cubic-bezier(0.175, 0.885, 0.32, 1.275)" />
        </div>
      </SubSection>

      <SubSection title="interactive demo">
        <div className="flex flex-wrap gap-4">
          <Button className="motion-fast transition-all hover:scale-105">
            fast (150ms)
          </Button>
          <Button variant="secondary" className="motion-base transition-all hover:scale-105">
            base (200ms)
          </Button>
          <Button variant="outline" className="motion-slow transition-all hover:scale-105">
            slow (300ms)
          </Button>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

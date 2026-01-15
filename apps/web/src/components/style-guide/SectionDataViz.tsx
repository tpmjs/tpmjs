'use client';

import { AnimatedCounter } from '@tpmjs/ui/AnimatedCounter/AnimatedCounter';
import { Button } from '@tpmjs/ui/Button/Button';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
import { FieldsetSection, SubSection } from './shared';

interface SectionDataVizProps {
  counterValue: number;
  onCounterChange: (value: number) => void;
}

export function SectionDataViz({ counterValue, onCounterChange }: SectionDataVizProps): React.ReactElement {
  return (
    <FieldsetSection title="9. data visualization" id="data-viz">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Guidelines for charts, metrics, and data displays. Semantic colors only—
        no rainbow charts.
      </p>

      <SubSection title="data color palette">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-accent p-4 text-center">
            <p className="font-mono text-sm text-white">primary data</p>
          </div>
          <div className="bg-foreground-secondary p-4 text-center">
            <p className="font-mono text-sm text-white">secondary data</p>
          </div>
          <div className="bg-foreground-tertiary p-4 text-center">
            <p className="font-mono text-sm text-white">tertiary data</p>
          </div>
          <div className="bg-border-strong p-4 text-center">
            <p className="font-mono text-sm text-white">baseline</p>
          </div>
        </div>

        <div className="bg-surface p-6 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-4">color rules for data</h4>
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• Use copper for primary/highlighted data series</li>
            <li>• Use grayscale for comparison and secondary series</li>
            <li>• Reserve semantic colors (success/warning/error) for threshold indicators</li>
            <li>• Create emphasis through opacity variation, not hue changes</li>
            <li>• Maximum 4 colors in any single visualization</li>
          </ul>
        </div>
      </SubSection>

      <SubSection title="quality score visualization">
        <p className="font-sans text-sm text-foreground-secondary mb-6">
          Tool quality scores use a consistent visual language across the platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="excellent"
            value={95}
            suffix="%"
            showBar
            barProgress={95}
          />
          <StatCard
            label="good"
            value={75}
            suffix="%"
            showBar
            barProgress={75}
          />
          <StatCard
            label="fair"
            value={50}
            suffix="%"
            showBar
            barProgress={50}
          />
          <StatCard
            label="poor"
            value={25}
            suffix="%"
            showBar
            barProgress={25}
          />
        </div>
      </SubSection>

      <SubSection title="progress indicators">
        <div className="space-y-6 max-w-xl">
          <div>
            <p className="font-mono text-sm text-foreground-secondary mb-2">primary (default)</p>
            <ProgressBar value={75} variant="primary" />
          </div>
          <div>
            <p className="font-mono text-sm text-foreground-secondary mb-2">success (completion)</p>
            <ProgressBar value={100} variant="success" />
          </div>
          <div>
            <p className="font-mono text-sm text-foreground-secondary mb-2">warning (approaching limit)</p>
            <ProgressBar value={85} variant="warning" />
          </div>
          <div>
            <p className="font-mono text-sm text-foreground-secondary mb-2">danger (at limit)</p>
            <ProgressBar value={98} variant="danger" />
          </div>
        </div>
      </SubSection>

      <SubSection title="animated counters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="font-mono text-3xl font-semibold">
              <AnimatedCounter value={counterValue} />
            </div>
            <p className="font-mono text-xs text-foreground-secondary mt-2">downloads</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-semibold">
              <AnimatedCounter value={Math.floor(counterValue * 0.8)} />
            </div>
            <p className="font-mono text-xs text-foreground-secondary mt-2">users</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-semibold">
              <AnimatedCounter value={Math.floor(counterValue * 0.05)} />
            </div>
            <p className="font-mono text-xs text-foreground-secondary mt-2">tools</p>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-semibold">
              <AnimatedCounter value={Math.floor(counterValue * 0.01)} />%
            </div>
            <p className="font-mono text-xs text-foreground-secondary mt-2">uptime</p>
          </div>
        </div>
        <div className="flex gap-2 mt-6 justify-center">
          <Button size="sm" onClick={() => onCounterChange(counterValue + 1000)}>+1000</Button>
          <Button size="sm" variant="outline" onClick={() => onCounterChange(Math.max(0, counterValue - 1000))}>-1000</Button>
          <Button size="sm" variant="secondary" onClick={() => onCounterChange(Math.floor(Math.random() * 100000))}>random</Button>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

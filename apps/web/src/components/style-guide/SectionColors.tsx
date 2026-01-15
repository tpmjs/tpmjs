'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { ColorCard, DoDontCard, FieldsetSection, SubSection } from './shared';

export function SectionColors(): React.ReactElement {
  return (
    <FieldsetSection title="2. color system" id="colors">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        A warm earthy palette with copper accent. Colors are designed for clarity,
        hierarchy, and accessibility.
      </p>

      {/* Color Palette Display */}
      <SubSection title="backgrounds">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorCard name="bg" color="bg-background" hex="#F5F3F0" desc="base background" />
          <ColorCard name="surface" color="bg-surface" hex="#FFFFFF" desc="cards, panels" />
          <ColorCard name="surface-2" color="bg-surface-2" hex="#FAF8F6" desc="elevated surfaces" />
          <ColorCard name="surface-3" color="bg-surface-3" hex="#F0EDEA" desc="highest elevation" />
        </div>
      </SubSection>

      <SubSection title="borders">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ColorCard name="border" color="bg-border" hex="#CEC9C3" desc="default borders" />
          <ColorCard name="border-strong" color="bg-border-strong" hex="#857F77" desc="emphasized borders" />
          <ColorCard name="border-subtle" color="bg-border-subtle" hex="#E3E0DC" desc="subtle borders" />
        </div>
      </SubSection>

      <SubSection title="text">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorCard name="text" color="bg-foreground" hex="#1A1715" desc="primary text" textLight />
          <ColorCard name="text-secondary" color="bg-foreground-secondary" hex="#5C564F" desc="secondary text" textLight />
          <ColorCard name="text-tertiary" color="bg-foreground-tertiary" hex="#817B74" desc="tertiary text" textLight />
          <ColorCard name="text-muted" color="bg-foreground-muted" hex="#9A958F" desc="muted text" textLight />
        </div>
      </SubSection>

      <SubSection title="accent (copper)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ColorCard name="accent" color="bg-accent" hex="#A6592D" desc="brand accent" textLight />
          <ColorCard name="accent-strong" color="bg-accent-strong" hex="#8F4722" desc="hover accent" textLight />
          <ColorCard name="accent-muted" color="bg-accent-muted" hex="#EDE5DF" desc="soft tint" />
        </div>
      </SubSection>

      <SubSection title="status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorCard name="success" color="bg-success" hex="#327D52" desc="success states" textLight />
          <ColorCard name="warning" color="bg-warning" hex="#D9A020" desc="warning states" />
          <ColorCard name="error" color="bg-error" hex="#C44545" desc="error states" textLight />
          <ColorCard name="info" color="bg-info" hex="#3380CC" desc="info states" textLight />
        </div>
      </SubSection>

      <SubSection title="status (light backgrounds)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorCard name="success-light" color="bg-success-light" hex="#E5F3EC" desc="success bg" />
          <ColorCard name="warning-light" color="bg-warning-light" hex="#F8F2E0" desc="warning bg" />
          <ColorCard name="error-light" color="bg-error-light" hex="#F9EDED" desc="error bg" />
          <ColorCard name="info-light" color="bg-info-light" hex="#EDF4FB" desc="info bg" />
        </div>
      </SubSection>

      {/* Color Usage Rules */}
      <SubSection title="color usage rules">
        <div className="space-y-6 mb-8">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">when to use copper vs neutral</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• <strong>Copper:</strong> Primary actions, active states, links, key metrics</li>
              <li>• <strong>Neutral:</strong> Secondary actions, borders, backgrounds, body text</li>
              <li>• <strong>Rule:</strong> Copper should be max ~10% of visible screen area</li>
            </ul>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">semantic color priority</h4>
            <div className="flex gap-2 items-center">
              <Badge variant="error">error</Badge>
              <span className="text-foreground-tertiary">{'>'}</span>
              <Badge variant="warning">warning</Badge>
              <span className="text-foreground-tertiary">{'>'}</span>
              <Badge variant="success">success</Badge>
              <span className="text-foreground-tertiary">{'>'}</span>
              <Badge variant="info">info</Badge>
            </div>
            <p className="text-xs text-foreground-tertiary mt-3 font-sans">
              When multiple states apply, show the highest priority color.
            </p>
          </div>
        </div>

        {/* Do/Don't Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoDontCard type="do" title="Use copper for primary CTAs">
            <div className="flex gap-3">
              <Button>publish tool</Button>
              <Button variant="secondary">cancel</Button>
            </div>
          </DoDontCard>
          <DoDontCard type="dont" title="Don't use copper for everything">
            <div className="flex gap-3">
              <Button>publish</Button>
              <Button>cancel</Button>
              <Button>back</Button>
            </div>
          </DoDontCard>
          <DoDontCard type="do" title="Use status colors with meaning">
            <div className="flex gap-3 items-center">
              <Badge variant="success">published</Badge>
              <Badge variant="warning">pending</Badge>
              <Badge variant="error">failed</Badge>
            </div>
          </DoDontCard>
          <DoDontCard type="dont" title="Don't use colors decoratively">
            <div className="flex gap-3 items-center">
              <Badge variant="success">tools</Badge>
              <Badge variant="warning">agents</Badge>
              <Badge variant="error">users</Badge>
            </div>
          </DoDontCard>
        </div>
      </SubSection>

      <SubSection title="contrast ratios (wcag aa)">
        <div className="overflow-x-auto">
          <Table variant="bordered">
            <TableHeader>
              <TableRow>
                <TableHead>combination</TableHead>
                <TableHead>ratio</TableHead>
                <TableHead>normal text</TableHead>
                <TableHead>large text</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">foreground / background</TableCell>
                <TableCell className="font-mono">12.5:1</TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">accent / background</TableCell>
                <TableCell className="font-mono">5.2:1</TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">foreground-secondary / background</TableCell>
                <TableCell className="font-mono">5.8:1</TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">foreground-tertiary / background</TableCell>
                <TableCell className="font-mono">3.9:1</TableCell>
                <TableCell><Badge variant="warning" size="sm">large only</Badge></TableCell>
                <TableCell><Badge variant="success" size="sm">pass</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

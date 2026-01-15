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
import { FieldsetSection, SubSection, TokenRow } from './shared';

interface SectionLayoutProps {
  density: 'compact' | 'comfortable' | 'spacious';
  onDensityChange: (density: 'compact' | 'comfortable' | 'spacious') => void;
}

export function SectionLayout({ density, onDensityChange }: SectionLayoutProps): React.ReactElement {
  return (
    <FieldsetSection title="7. layout & responsiveness" id="layout">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Mobile-first responsive design with clear breakpoints and density modes
        for different use cases.
      </p>

      <SubSection title="breakpoints">
        <div className="space-y-4 mb-8">
          <TokenRow name="sm" value="640px" preview={<Badge size="sm">mobile landscape</Badge>} />
          <TokenRow name="md" value="768px" preview={<Badge size="sm">tablet</Badge>} />
          <TokenRow name="lg" value="1024px" preview={<Badge size="sm">desktop</Badge>} />
          <TokenRow name="xl" value="1280px" preview={<Badge size="sm">wide</Badge>} />
          <TokenRow name="2xl" value="1536px" preview={<Badge size="sm">ultrawide</Badge>} />
        </div>

        <div className="bg-surface p-6 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-4">responsive behaviors</h4>
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• <strong>Sidebar:</strong> Collapsible on mobile, visible on lg+</li>
            <li>• <strong>Tables:</strong> Horizontal scroll on mobile, full width on lg+</li>
            <li>• <strong>Cards:</strong> Single column on mobile, grid on md+</li>
            <li>• <strong>Navigation:</strong> Hamburger menu on mobile, horizontal on lg+</li>
          </ul>
        </div>
      </SubSection>

      <SubSection title="density modes">
        <p className="font-sans text-sm text-foreground-secondary mb-6">
          Density modes adjust spacing, font size, and row heights for different contexts.
          Essential for data-dense developer tools.
        </p>

        <div className="flex gap-4 mb-6">
          <Button
            variant={density === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDensityChange('compact')}
          >
            compact
          </Button>
          <Button
            variant={density === 'comfortable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDensityChange('comfortable')}
          >
            comfortable
          </Button>
          <Button
            variant={density === 'spacious' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDensityChange('spacious')}
          >
            spacious
          </Button>
        </div>

        <div data-density={density} className="border border-dashed border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="density-cell">name</TableHead>
                <TableHead className="density-cell">downloads</TableHead>
                <TableHead className="density-cell">status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="density-cell font-mono">@tpmjs/parser</TableCell>
                <TableCell className="density-cell font-mono">125,432</TableCell>
                <TableCell className="density-cell"><Badge variant="success" size="sm">active</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="density-cell font-mono">@tpmjs/validator</TableCell>
                <TableCell className="density-cell font-mono">89,231</TableCell>
                <TableCell className="density-cell"><Badge variant="success" size="sm">active</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="density-cell font-mono">@tpmjs/transform</TableCell>
                <TableCell className="density-cell font-mono">45,678</TableCell>
                <TableCell className="density-cell"><Badge variant="warning" size="sm">beta</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <p className="font-mono text-xs text-foreground-secondary mb-1">compact</p>
            <p className="font-mono text-lg">36px rows</p>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <p className="font-mono text-xs text-foreground-secondary mb-1">comfortable</p>
            <p className="font-mono text-lg">48px rows</p>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border text-center">
            <p className="font-mono text-xs text-foreground-secondary mb-1">spacious</p>
            <p className="font-mono text-lg">64px rows</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="grid system">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">12-column grid</p>
            <div className="grid grid-cols-12 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-surface border border-dashed border-border p-2 text-center">
                  <span className="font-mono text-[10px] text-foreground-tertiary">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">sidebar + content (3 + 9)</p>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 bg-surface border border-dashed border-border p-4">
                <span className="font-mono text-xs">sidebar</span>
              </div>
              <div className="col-span-9 bg-surface border border-dashed border-border p-4">
                <span className="font-mono text-xs">main content</span>
              </div>
            </div>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

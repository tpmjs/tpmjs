'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { FieldsetSection, SubSection } from './shared';

type A11yRequirement = {
  component: string;
  ariaPattern: string;
  focusTrap: boolean;
  keyboard: string[];
  reducedMotion: string;
};

const overlayComponents: A11yRequirement[] = [
  {
    component: 'Modal',
    ariaPattern: 'dialog',
    focusTrap: true,
    keyboard: ['Esc (close)', 'Tab (cycle focus)'],
    reducedMotion: 'Instant open/close',
  },
  {
    component: 'Drawer',
    ariaPattern: 'dialog',
    focusTrap: true,
    keyboard: ['Esc (close)', 'Tab (cycle focus)'],
    reducedMotion: 'No slide animation',
  },
  {
    component: 'Popover',
    ariaPattern: 'dialog',
    focusTrap: false,
    keyboard: ['Esc (close)', 'Tab (move to next)'],
    reducedMotion: 'Instant show/hide',
  },
  {
    component: 'Tooltip',
    ariaPattern: 'tooltip',
    focusTrap: false,
    keyboard: ['Focus trigger (show)', 'Blur (hide)'],
    reducedMotion: 'Instant show/hide',
  },
  {
    component: 'DropdownMenu',
    ariaPattern: 'menu',
    focusTrap: false,
    keyboard: ['Enter/Space (select)', 'Arrow keys (navigate)', 'Esc (close)'],
    reducedMotion: 'Instant show/hide',
  },
  {
    component: 'Toast',
    ariaPattern: 'alert / status',
    focusTrap: false,
    keyboard: ['Focus action button', 'Enter (action)'],
    reducedMotion: 'No slide animation',
  },
];

const formComponents: A11yRequirement[] = [
  {
    component: 'Input',
    ariaPattern: 'textbox',
    focusTrap: false,
    keyboard: ['Tab (focus)', 'Type (input)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Select',
    ariaPattern: 'listbox',
    focusTrap: false,
    keyboard: ['Enter/Space (open)', 'Arrow keys (navigate)', 'Esc (close)'],
    reducedMotion: 'Instant show/hide',
  },
  {
    component: 'Checkbox',
    ariaPattern: 'checkbox',
    focusTrap: false,
    keyboard: ['Space (toggle)', 'Tab (focus)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Radio',
    ariaPattern: 'radiogroup',
    focusTrap: false,
    keyboard: ['Arrow keys (select)', 'Tab (focus)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Switch',
    ariaPattern: 'switch',
    focusTrap: false,
    keyboard: ['Space (toggle)', 'Tab (focus)'],
    reducedMotion: 'Instant toggle',
  },
  {
    component: 'Slider',
    ariaPattern: 'slider',
    focusTrap: false,
    keyboard: ['Arrow keys (adjust)', 'Home/End (min/max)'],
    reducedMotion: 'N/A',
  },
];

const navigationComponents: A11yRequirement[] = [
  {
    component: 'Tabs',
    ariaPattern: 'tablist',
    focusTrap: false,
    keyboard: ['Arrow keys (navigate)', 'Enter/Space (select)', 'Home/End (first/last)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Breadcrumbs',
    ariaPattern: 'navigation',
    focusTrap: false,
    keyboard: ['Tab (focus links)', 'Enter (activate)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Pagination',
    ariaPattern: 'navigation',
    focusTrap: false,
    keyboard: ['Tab (focus)', 'Enter (activate)'],
    reducedMotion: 'N/A',
  },
  {
    component: 'Accordion',
    ariaPattern: 'region',
    focusTrap: false,
    keyboard: ['Enter/Space (toggle)', 'Tab (focus)'],
    reducedMotion: 'Instant expand/collapse',
  },
];

function A11yTable({ components, title }: { components: A11yRequirement[]; title: string }) {
  return (
    <div className="mb-8">
      <h4 className="font-mono text-sm font-medium mb-4 pb-2 border-b border-dashed border-border">
        {title}
      </h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>component</TableHead>
              <TableHead>aria pattern</TableHead>
              <TableHead>focus trap</TableHead>
              <TableHead>keyboard</TableHead>
              <TableHead>reduced motion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((comp) => (
              <TableRow key={comp.component}>
                <TableCell className="font-mono text-sm">{comp.component}</TableCell>
                <TableCell>
                  <code className="text-xs bg-surface-2 px-2 py-0.5">{comp.ariaPattern}</code>
                </TableCell>
                <TableCell>
                  {comp.focusTrap ? (
                    <Badge variant="success" size="sm">yes</Badge>
                  ) : (
                    <Badge variant="outline" size="sm">no</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {comp.keyboard.map((k, i) => (
                      <div key={i} className="text-xs text-foreground-secondary">{k}</div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-foreground-secondary">
                  {comp.reducedMotion}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SectionA11yChecklists(): React.ReactElement {
  return (
    <FieldsetSection title="19. accessibility checklists" id="a11y-checklists">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Component-level accessibility requirements and implementation guides.
        All components follow WCAG 2.1 AA standards.
      </p>

      <SubSection title="aria patterns & keyboard">
        <p className="font-sans text-sm text-foreground-secondary mb-6">
          Each component has specific ARIA patterns and keyboard interactions that must be implemented.
        </p>

        <A11yTable components={overlayComponents} title="overlay components" />
        <A11yTable components={formComponents} title="form components" />
        <A11yTable components={navigationComponents} title="navigation components" />
      </SubSection>

      <SubSection title="focus management">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Proper focus management is critical for keyboard and screen reader users.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4 flex items-center gap-2">
              <Icon icon="check" size="sm" className="text-success" />
              focus trap required
            </h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>Modal dialogs - trap focus inside</li>
              <li>Drawer sheets - trap until closed</li>
              <li>Full-screen overlays</li>
            </ul>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4 flex items-center gap-2">
              <Icon icon="arrowRight" size="sm" className="text-accent" />
              focus restoration
            </h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>Return focus to trigger on close</li>
              <li>Save and restore focus position</li>
              <li>Skip links for long content</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-3">implementation pattern</h4>
          <pre className="text-xs font-mono text-foreground-secondary overflow-x-auto">
{`// Focus trap implementation
const dialogRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

// Save trigger reference before opening
const handleOpen = () => {
  triggerRef.current = document.activeElement as HTMLButtonElement;
  setOpen(true);
};

// Restore focus on close
const handleClose = () => {
  setOpen(false);
  triggerRef.current?.focus();
};`}
          </pre>
        </div>
      </SubSection>

      <SubSection title="screen reader announcements">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Use live regions to announce dynamic content changes.
        </p>
        <div className="space-y-4">
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-3">aria-live regions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-surface-2">
                <code className="text-xs">aria-live="polite"</code>
                <p className="text-xs text-foreground-secondary mt-2">
                  Toast notifications, status updates
                </p>
              </div>
              <div className="p-3 bg-surface-2">
                <code className="text-xs">aria-live="assertive"</code>
                <p className="text-xs text-foreground-secondary mt-2">
                  Error messages, critical alerts
                </p>
              </div>
              <div className="p-3 bg-surface-2">
                <code className="text-xs">role="status"</code>
                <p className="text-xs text-foreground-secondary mt-2">
                  Loading states, progress updates
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-3">component announcements</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>event</TableHead>
                  <TableHead>announcement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-sm">Toast shown</TableCell>
                  <TableCell className="text-sm text-foreground-secondary">"[message content]"</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm">Modal opened</TableCell>
                  <TableCell className="text-sm text-foreground-secondary">"[dialog title], dialog"</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm">Form error</TableCell>
                  <TableCell className="text-sm text-foreground-secondary">"Error: [field name], [error message]"</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm">Loading complete</TableCell>
                  <TableCell className="text-sm text-foreground-secondary">"Loading complete, [N] results"</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </SubSection>

      <SubSection title="color contrast requirements">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          All text must meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background border border-border">
              <span className="text-foreground">foreground on background</span>
              <Badge variant="success" size="sm">9.2:1</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface border border-border">
              <span className="text-foreground-secondary">secondary on surface</span>
              <Badge variant="success" size="sm">5.8:1</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface border border-border">
              <span className="text-foreground-tertiary">tertiary on surface</span>
              <Badge variant="warning" size="sm">4.5:1</Badge>
            </div>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-3">contrast verification</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• Test all color combinations in both themes</li>
              <li>• Verify focus indicators (3:1 minimum)</li>
              <li>• Ensure error states meet requirements</li>
              <li>• Check interactive state contrast changes</li>
            </ul>
          </div>
        </div>
      </SubSection>

      <SubSection title="reduced motion support">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Respect the <code className="px-1 bg-surface-2 text-xs">prefers-reduced-motion</code> media query
          for users who experience motion sickness or vestibular disorders.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-3">implementation</h4>
          <pre className="text-xs font-mono text-foreground-secondary overflow-x-auto">
{`// CSS approach
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// React hook approach
import { useReducedMotion } from '@tpmjs/ui/system/hooks/useReducedMotion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={prefersReducedMotion ? 'instant' : 'animated'}
    />
  );
}`}
          </pre>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-success-light border border-success">
            <p className="font-mono text-sm text-success mb-1">always animate</p>
            <p className="text-xs text-foreground-secondary">Progress bars, loading spinners</p>
          </div>
          <div className="p-3 bg-warning-light border border-warning">
            <p className="font-mono text-sm text-warning mb-1">respect preference</p>
            <p className="text-xs text-foreground-secondary">Page transitions, modal animations</p>
          </div>
          <div className="p-3 bg-error-light border border-error">
            <p className="font-mono text-sm text-error mb-1">never animate</p>
            <p className="text-xs text-foreground-secondary">Auto-playing video, parallax</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="testing checklist">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Before shipping any component, verify accessibility with these tests.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-3 flex items-center gap-2">
              <Icon icon="terminal" size="sm" />
              keyboard testing
            </h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Tab through all interactive elements
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Verify focus is visible at all times
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Test Enter/Space activation
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Verify Escape closes overlays
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Test arrow key navigation
              </li>
            </ul>
          </div>
          <div className="bg-surface p-4 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-3 flex items-center gap-2">
              <Icon icon="search" size="sm" />
              screen reader testing
            </h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Test with VoiceOver (macOS/iOS)
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Test with NVDA (Windows)
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Verify all content is announced
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Check landmark navigation
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="box" size="xs" className="text-foreground-tertiary" />
                Test live region updates
              </li>
            </ul>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

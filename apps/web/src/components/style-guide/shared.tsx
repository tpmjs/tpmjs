'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';

/**
 * Fieldset-style container with legend label
 */
export function FieldsetSection({
  title,
  children,
  id,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}): React.ReactElement {
  return (
    <fieldset
      id={id}
      className={`border border-dashed border-border p-8 mb-16 scroll-mt-24 ${className}`}
    >
      <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Sub-section with title and copper dot indicator
 */
export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-14 last:mb-0">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-1 bg-accent" />
        <h3 className="font-mono text-[11px] font-semibold tracking-widest uppercase text-foreground-secondary">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/**
 * Hover-interactive info card (replaces flat bg-surface boxes)
 */
export function InfoCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`group relative bg-surface border border-border p-6 transition-all duration-150 hover:-translate-y-px hover:shadow-sm hover:border-accent/20 ${className}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0 bg-accent/40 transition-all duration-200 group-hover:w-[2px]" />
      {title && <h4 className="font-mono text-sm font-medium mb-4">{title}</h4>}
      {children}
    </div>
  );
}

/**
 * Copper-accented rule box for guidelines and requirements
 */
export function RuleBox({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`border-l-[3px] border-l-accent bg-surface-2 p-6 ${className}`}>
      {title && <h4 className="font-mono text-sm font-medium mb-4">{title}</h4>}
      {children}
    </div>
  );
}

/**
 * Styled keyboard shortcut display
 */
export function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 bg-surface-2 border border-border font-mono text-[11px] text-foreground-secondary shadow-[0_1px_0_0] shadow-border">
      {children}
    </kbd>
  );
}

/**
 * Color swatch card
 */
export function ColorCard({
  name,
  color,
  hex,
  desc,
  textLight = false,
}: {
  name: string;
  color: string;
  hex: string;
  desc: string;
  textLight?: boolean;
}): React.ReactElement {
  return (
    <div className={`${color} p-4 border border-dashed border-border`}>
      <div
        className={`font-mono text-sm font-medium ${textLight ? 'text-white' : 'text-foreground'}`}
      >
        {name}
      </div>
      <div
        className={`font-mono text-xs ${textLight ? 'text-white/80' : 'text-foreground-secondary'}`}
      >
        {hex}
      </div>
      <div
        className={`font-mono text-xs mt-2 ${textLight ? 'text-white/60' : 'text-foreground-tertiary'}`}
      >
        {desc}
      </div>
    </div>
  );
}

/**
 * Do/Don't example card
 */
export function DoDontCard({
  type,
  title,
  children,
}: {
  type: 'do' | 'dont';
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  const isDo = type === 'do';
  return (
    <div className={`border-2 ${isDo ? 'border-success' : 'border-error'} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${isDo ? 'text-success' : 'text-error'}`}>
        <Icon icon={isDo ? 'check' : 'x'} size="sm" />
        <span className="font-mono text-sm font-medium uppercase">{isDo ? 'do' : "don't"}</span>
      </div>
      <p className="font-mono text-xs text-foreground-secondary mb-3">{title}</p>
      <div className="bg-surface p-3 border border-dashed border-border">{children}</div>
    </div>
  );
}

/**
 * Principle card with icon
 */
export function PrincipleCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="border border-dashed border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
          <Icon
            icon={icon as Parameters<typeof Icon>[0]['icon']}
            size="md"
            className="text-accent"
          />
        </div>
        <h4 className="font-mono text-base font-medium text-foreground">{title}</h4>
      </div>
      <p className="font-sans text-sm text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Token display row
 */
export function TokenRow({
  name,
  value,
  preview,
}: {
  name: string;
  value: string;
  preview?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-dashed border-border last:border-0">
      <code className="font-mono text-xs text-accent w-48">{name}</code>
      <span className="font-mono text-xs text-foreground-secondary flex-1">{value}</span>
      {preview && <div className="w-24">{preview}</div>}
    </div>
  );
}

/**
 * Navigation item for table of contents
 */
export function NavItem({
  href,
  children,
  indent = false,
}: {
  href: string;
  children: React.ReactNode;
  indent?: boolean;
}): React.ReactElement {
  return (
    <a
      href={href}
      className={`block font-mono text-sm text-foreground-secondary hover:text-accent transition-colors ${indent ? 'pl-4' : ''}`}
    >
      {children}
    </a>
  );
}

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
    <fieldset id={id} className={`border border-dashed border-border p-8 mb-16 scroll-mt-24 ${className}`}>
      <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Sub-section with title
 */
export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-10 last:mb-0">
      <h3 className="font-mono text-base font-medium mb-6 text-foreground lowercase">{title}</h3>
      {children}
    </div>
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
      <div className={`font-mono text-sm font-medium ${textLight ? 'text-white' : 'text-foreground'}`}>
        {name}
      </div>
      <div className={`font-mono text-xs ${textLight ? 'text-white/80' : 'text-foreground-secondary'}`}>
        {hex}
      </div>
      <div className={`font-mono text-xs mt-2 ${textLight ? 'text-white/60' : 'text-foreground-tertiary'}`}>
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
      <div className="bg-surface p-3 border border-dashed border-border">
        {children}
      </div>
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
          <Icon icon={icon as Parameters<typeof Icon>[0]['icon']} size="md" className="text-accent" />
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

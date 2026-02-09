'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExecutorsDiagram } from './architecture/ExecutorsDiagram';
import { NpmRegistryDiagram } from './architecture/NpmRegistryDiagram';
import { OutputsDiagram } from './architecture/OutputsDiagram';
import { ToolsDiagram } from './architecture/ToolsDiagram';
import { TpmjsDiagram } from './architecture/TpmjsDiagram';
import { UsersDiagram } from './architecture/UsersDiagram';

// Map node IDs to their diagram components
const diagramComponents: Record<string, React.ComponentType> = {
  tools: ToolsDiagram,
  npm: NpmRegistryDiagram,
  tpmjs: TpmjsDiagram,
  users: UsersDiagram,
  executors: ExecutorsDiagram,
  outputs: OutputsDiagram,
};

interface NodeDetailOverlayProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  title: string;
  description: string;
  bullets: string[];
  links?: { label: string; href: string }[];
}

export function NodeDetailOverlay({
  open,
  onClose,
  nodeId,
  title,
  description,
  bullets,
  links,
}: NodeDetailOverlayProps): React.ReactElement | null {
  const DiagramComponent = diagramComponents[nodeId];
  const [isVisible, setIsVisible] = useState(false);

  // Handle escape key and animation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Trigger animation after mount
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      queueMicrotask(() => setIsVisible(false));
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss pattern */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center pointer-events-none">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation on modal */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation on modal */}
        <div
          className={`relative w-full max-w-6xl max-h-full bg-background border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col transition-all duration-250 ease-out ${
            isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-5'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface transition-colors text-foreground-secondary hover:text-foreground"
              aria-label="Close"
            >
              <Icon icon="x" size="md" />
            </button>
          </div>

          {/* Content - Two column layout */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
              {/* Left: Diagram */}
              <div className="p-6 bg-surface/30 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                  How It Works
                </h3>
                <div className="flex-1 bg-background rounded-xl border border-border p-4 min-h-[350px]">
                  {DiagramComponent && <DiagramComponent />}
                </div>
                <p className="text-xs text-foreground-tertiary italic mt-3 text-center">
                  Hover over elements for more details
                </p>
              </div>

              {/* Right: Details */}
              <div className="p-6 flex flex-col gap-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                    Overview
                  </h3>
                  <p className="text-foreground-secondary leading-relaxed">{description}</p>
                </div>

                {/* Bullet points */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {bullets.map((bullet, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: bullets are static strings without unique IDs
                      <li key={i} className="flex items-start gap-3">
                        <Icon
                          icon="check"
                          size="sm"
                          className="flex-shrink-0 mt-0.5 text-primary"
                        />
                        <span className="text-sm text-foreground-secondary">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Links */}
                {links && links.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                      Learn More
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {links.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <Button variant="outline" size="sm">
                            {link.label}
                            <Icon icon="arrowRight" size="sm" className="ml-1" />
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-border bg-surface/50">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

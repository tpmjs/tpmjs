'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';

const INSTALL_CMD = 'curl -fsSL https://tpmjs.com/install.sh | bash';

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      className={`p-1.5 text-foreground-tertiary hover:text-foreground transition-colors ${className || ''}`}
      aria-label="Copy to clipboard"
    >
      <Icon icon={copied ? 'check' : 'copy'} size="xs" />
    </Button>
  );
}

export function GetStartedSection(): React.ReactElement {
  return (
    <section className="py-20 bg-surface border-t border-border relative overflow-hidden">
      {/* Subtle diagonal lines background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              currentColor,
              currentColor 1px,
              transparent 1px,
              transparent 20px
            )`,
          }}
        />
      </div>

      <Container size="xl" padding="lg" className="relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            get started in 60 seconds
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            one command. every editor.
          </h2>
          <p className="text-base text-foreground-secondary max-w-xl mx-auto font-sans">
            Pick your tool collections, choose your editors, run the script. All your MCP servers
            configured in one shot.
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 mb-16">
          {/* Step 1 */}
          <div className="group p-6 border border-dashed border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
              <span className="font-mono text-lg text-primary">1</span>
            </div>
            <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
              pick your collections
            </h3>
            <p className="font-sans text-xs text-foreground-secondary leading-relaxed">
              Browse tool collections — yours, or any public one.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group p-6 border border-dashed border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
              <span className="font-mono text-lg text-primary">2</span>
            </div>
            <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
              choose your editors
            </h3>
            <p className="font-sans text-xs text-foreground-secondary leading-relaxed">
              Map collections to Claude Code, Cursor, Windsurf, or Claude Desktop.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group p-6 border border-dashed border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
              <span className="font-mono text-lg text-primary">3</span>
            </div>
            <h3 className="font-mono text-sm font-medium text-foreground mb-2 lowercase">
              run one command
            </h3>
            <p className="font-sans text-xs text-foreground-secondary leading-relaxed">
              Paste in your terminal. MCP servers configured across all selected editors.
            </p>
          </div>
        </div>

        {/* Command Box */}
        <fieldset className="border border-dashed border-border p-6 md:p-8 max-w-2xl mx-auto mb-12">
          <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
            install script
          </legend>

          <div className="relative">
            <div className="p-4 bg-background border border-border font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold select-none">$</span>
                <pre className="text-foreground whitespace-pre">{INSTALL_CMD}</pre>
              </div>
            </div>
            <CopyButton text={INSTALL_CMD} className="absolute top-3 right-3" />
          </div>

          <div className="mt-4 flex items-start gap-3 p-3 bg-background border border-dashed border-border">
            <span className="font-mono text-xs text-primary mt-0.5">tip</span>
            <p className="font-mono text-xs text-foreground-secondary">
              go to{' '}
              <Link href="/setup" className="text-primary hover:underline">
                tpmjs.com/setup
              </Link>{' '}
              first to select collections and get a personalized command with your token baked in.
            </p>
          </div>
        </fieldset>

        {/* Supported Editors */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: '>_', name: 'Claude Code' },
            { icon: 'C', name: 'Claude Desktop' },
            { icon: '{;}', name: 'Cursor' },
            { icon: 'W', name: 'Windsurf' },
          ].map((editor) => (
            <div
              key={editor.name}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-background font-mono text-sm"
            >
              <span className="text-primary font-bold">{editor.icon}</span>
              <span className="text-foreground-secondary">{editor.name}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link href="/setup">
              <Button size="lg" variant="default">
                Configure Your Setup
              </Button>
            </Link>
            <Link href="/collections">
              <Button size="lg" variant="outline">
                Browse Collections
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

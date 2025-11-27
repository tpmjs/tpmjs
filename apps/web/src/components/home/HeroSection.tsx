'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Input } from '@tpmjs/ui/Input/Input';
import { useState } from 'react';

export function HeroSection(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-background">
      {/* Blueprint Grid Background - Static with Scanline */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex min-h-[90vh] flex-col justify-center px-6 md:px-12 lg:px-24">
        {/* Main Heading */}
        <div className="max-w-7xl">
          <h1
            className="mb-8 font-bold leading-none tracking-tight text-foreground"
            style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
          >
            TOOL REGISTRY FOR AI AGENTS
          </h1>

          {/* Live Metrics Strip */}
          <div className="mb-12 flex flex-wrap items-center gap-3 border-l-[6px] border-brutalist-accent pl-6 font-mono text-base md:text-lg font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-foreground">2,847</span>
              <span className="text-foreground-secondary">TOOLS</span>
            </div>
            <span className="text-foreground-tertiary">/</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">12M+</span>
              <span className="text-foreground-secondary">INVOCATIONS</span>
            </div>
            <span className="text-foreground-tertiary">/</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">47ms</span>
              <span className="text-foreground-secondary">LATENCY</span>
            </div>
          </div>

          {/* Subheading */}
          <p className="mb-12 max-w-3xl text-xl md:text-2xl font-medium leading-relaxed text-foreground-secondary tracking-tight">
            Discover, share, and integrate tools that give your agents superpowers.
            <br />
            The registry for AI tools.
          </p>

          {/* Brutalist Search Interface */}
          <div className="max-w-3xl">
            <div className="relative">
              {/* Command Line Prompt */}
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-6 font-mono text-brutalist-accent text-lg font-bold pointer-events-none">
                $
              </div>

              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search tools..."
                className="brutalist-border h-16 md:h-20 pl-14 pr-36 md:pr-40 text-lg md:text-xl font-mono placeholder:text-foreground-tertiary placeholder:uppercase focus:ring-4 focus:ring-brutalist-accent focus:ring-offset-0 bg-background"
                style={{ borderRadius: 0 }}
              />

              {/* Search Button */}
              <Button
                size="lg"
                className="brutalist-border-thick absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-6 md:px-8 bg-brutalist-accent text-foreground hover:bg-brutalist-accent-hover font-bold uppercase tracking-wider shadow-lg"
                style={{ borderRadius: 0, borderColor: 'hsl(var(--foreground))' }}
              >
                Search
              </Button>
            </div>

            {/* Helper Text */}
            <div className="mt-4 flex items-center gap-4 font-mono text-xs text-foreground-tertiary uppercase tracking-wider">
              <span>
                Try: &ldquo;web-scraper&rdquo;, &ldquo;github-manager&rdquo;,
                &ldquo;sql-query&rdquo;
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
          <span className="font-mono text-xs uppercase tracking-widest text-foreground-tertiary">
            Scroll
          </span>
          <div className="h-8 w-[2px] bg-brutalist-accent" />
        </div>
      </div>
    </section>
  );
}

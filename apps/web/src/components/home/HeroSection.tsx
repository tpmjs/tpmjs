'use client';

import { AnimatedCounter } from '@tpmjs/ui/AnimatedCounter/AnimatedCounter';
import { Button } from '@tpmjs/ui/Button/Button';
import { Input } from '@tpmjs/ui/Input/Input';
import { useParallax } from '@tpmjs/ui/system/hooks/useParallax';
import { useState } from 'react';

export function HeroSection(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const parallaxStyle = useParallax({ speed: 0.5 });

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-background">
      {/* Brutalist Grid Background - Static, Not Parallax */}
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

      {/* Content Container with Parallax */}
      <div
        style={parallaxStyle}
        className="relative z-10 flex min-h-[90vh] flex-col justify-center px-6 md:px-12 lg:px-24"
      >
        {/* Glitch Bars - Decorative Elements */}
        <div
          className="absolute left-0 top-32 h-1.5 w-64 bg-brutalist-accent opacity-80 animate-glitch"
          style={{
            animationDelay: '0.5s',
            animationIterationCount: 'infinite',
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute right-0 top-48 h-1 w-48 bg-foreground opacity-30 animate-glitch"
          style={{
            animationDelay: '1.5s',
            animationIterationCount: 'infinite',
            animationDuration: '4s',
          }}
        />

        {/* Main Heading - Brutalist Typography */}
        <div className="max-w-7xl">
          <h1 className="brutalist-heading mb-8 leading-[0.85] tracking-tighter">
            TOOL
            <br />
            REGISTRY
            <br />
            <span className="text-brutalist-accent">FOR AI AGENTS</span>
          </h1>

          {/* Live Metrics Strip */}
          <div className="mb-12 flex flex-wrap items-center gap-3 border-l-[6px] border-brutalist-accent pl-6 font-mono text-base md:text-lg font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <AnimatedCounter value={2847} separator="," size="md" />
              <span className="text-foreground-secondary">TOOLS</span>
            </div>
            <span className="text-foreground-tertiary">/</span>
            <div className="flex items-center gap-2">
              {/* Mobile: abbreviated */}
              <AnimatedCounter value={12} suffix="M+" size="md" className="md:hidden" />
              {/* Desktop: full */}
              <AnimatedCounter
                value={12000000}
                suffix="+"
                separator=","
                size="md"
                className="hidden md:inline"
              />
              <span className="text-foreground-secondary">INVOCATIONS</span>
            </div>
            <span className="text-foreground-tertiary">/</span>
            <div className="flex items-center gap-2">
              <AnimatedCounter value={47} suffix="ms" size="md" />
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
                className="brutalist-border-thick absolute right-2 top-1/2 -translate-y-1/2 h-12 md:h-16 px-6 md:px-8 bg-brutalist-accent text-background hover:bg-brutalist-accent-hover font-bold uppercase tracking-wider shadow-lg"
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

'use client';

import { AnimatedCounter } from '@tpmjs/ui/AnimatedCounter/AnimatedCounter';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { GlitchBars } from '~/components/home/GlitchBars';
import { useSession } from '~/lib/auth-client';

interface SamplePrompt {
  title: string;
  description: string;
  prompt: string;
  icon: 'globe' | 'search' | 'terminal' | 'box' | 'star' | 'folder';
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: 'Web Scraping',
    description: 'Extract content from any website',
    prompt: 'Scrape https://news.ycombinator.com and summarize the top 5 stories',
    icon: 'globe',
  },
  {
    title: 'Search & Research',
    description: 'Search the web for information',
    prompt: 'Search for the latest news about AI agents and summarize the key developments',
    icon: 'search',
  },
  {
    title: 'Code Generation',
    description: 'Generate code for various tasks',
    prompt: 'Find a tool that can generate QR codes and create one for https://tpmjs.com',
    icon: 'terminal',
  },
  {
    title: 'Image Processing',
    description: 'Work with images and files',
    prompt: 'Find image processing tools and tell me what they can do',
    icon: 'box',
  },
  {
    title: 'Data Analysis',
    description: 'Analyze and transform data',
    prompt: 'Search for data processing tools that can help me analyze JSON data',
    icon: 'folder',
  },
  {
    title: 'Creative Tasks',
    description: 'Generate content and ideas',
    prompt: 'Find a blog post creation tool and write a short post about the future of AI',
    icon: 'star',
  },
];

/**
 * Omega Landing Page — "The Infinite Arsenal"
 */
export default function OmegaLandingPage(): React.ReactElement {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAuthenticated = !!session?.user;

  const createConversation = useCallback(
    async (initialPrompt?: string) => {
      if (!isAuthenticated) {
        const returnUrl = initialPrompt
          ? `/omega?prompt=${encodeURIComponent(initialPrompt)}`
          : '/omega';
        router.push(`/sign-in?returnTo=${encodeURIComponent(returnUrl)}`);
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch('/api/omega/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            router.push(`/sign-in?returnTo=${encodeURIComponent('/omega')}`);
            return;
          }
          throw new Error(data.error?.message || data.error || 'Failed to create conversation');
        }

        const data = await response.json();
        const conversationId = data.data.id;

        if (initialPrompt) {
          sessionStorage.setItem(`omega_prompt_${conversationId}`, initialPrompt);
        }
        router.push(`/omega/${conversationId}`);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to create conversation');
        setIsCreating(false);
      }
    },
    [router, isAuthenticated]
  );

  // Handle prompt query parameter (redirect from sign-in)
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prompt = params.get('prompt');
      if (prompt) {
        window.history.replaceState({}, '', '/omega');
        createConversation(prompt);
      }
    }
  }, [isAuthenticated, createConversation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        createConversation(input.trim());
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 flex flex-col">
        {/* Zone 1 — Monumental Hero */}
        <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 grid-background opacity-[0.04]" />
          <div className="absolute inset-0 blueprint-scanline" />
          <GlitchBars count={4} />

          <div className="relative z-10 text-center px-4">
            {/* Badge */}
            <div className="animate-brutalist-entrance mb-8" style={{ animationDelay: '0ms' }}>
              <Badge variant="outline" size="lg">
                <Icon icon="terminal" size="xs" className="mr-2" />
                omega agent
              </Badge>
            </div>

            {/* The Number */}
            <div className="animate-brutalist-entrance mb-4" style={{ animationDelay: '150ms' }}>
              <AnimatedCounter
                value={1000000}
                suffix="+"
                separator=","
                duration={2500}
                className="brutalist-heading"
              />
            </div>

            {/* Subheading */}
            <h2
              className="brutalist-subheading text-foreground mb-6 animate-brutalist-entrance"
              style={{ animationDelay: '300ms' }}
            >
              TOOLS AT YOUR COMMAND
            </h2>

            {/* Description */}
            <p
              className="font-mono text-foreground-secondary max-w-xl mx-auto text-sm md:text-base animate-brutalist-entrance"
              style={{ animationDelay: '450ms' }}
            >
              One AI agent with access to the entire TPMJS registry. Describe what you need — Omega
              discovers and executes the right tools automatically.
            </p>
          </div>
        </div>

        {/* Zone 2 — Input-First Command Area */}
        <div className="bg-surface border-y-2 border-foreground py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div
              className={`border-2 transition-colors ${
                isCreating ? 'border-primary' : 'border-foreground focus-within:border-primary'
              }`}
            >
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you want to build, find, or analyze?"
                rows={3}
                resize="none"
                className="border-none bg-transparent text-lg"
                disabled={isCreating}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <span className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider">
                  Enter to launch
                </span>
                <Button
                  onClick={() => input.trim() && createConversation(input.trim())}
                  disabled={!input.trim() || isCreating}
                  size="sm"
                >
                  {isCreating ? (
                    <>
                      <Icon icon="loader" size="xs" className="mr-2 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Icon icon="send" size="xs" className="mr-2" />
                      Launch
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Auth gate */}
            {!isSessionLoading && !isAuthenticated && (
              <div className="mt-4 text-center">
                <Link
                  href={`/sign-in?returnTo=${encodeURIComponent('/omega')}`}
                  className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  <Icon icon="user" size="xs" />
                  Sign in to start
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-4 px-4">
            <p className="text-sm text-error font-mono">{error}</p>
          </div>
        )}

        {/* Zone 3 — Sample Prompts */}
        <div className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-mono text-xs text-foreground-tertiary uppercase tracking-widest text-center mb-8">
              {isAuthenticated ? 'Or try one of these' : 'Explore what Omega can do'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={prompt.title}
                  type="button"
                  onClick={() => createConversation(prompt.prompt)}
                  disabled={isCreating || isSessionLoading}
                  className="group p-4 bg-background border-2 border-border hover:border-foreground transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_hsl(var(--primary))] animate-brutalist-entrance"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center flex-shrink-0">
                      <Icon icon={prompt.icon} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-mono font-bold text-foreground uppercase text-sm tracking-tight">
                          {prompt.title}
                        </h3>
                        <span className="font-mono text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          launch &rarr;
                        </span>
                      </div>
                      <p className="text-sm text-foreground-secondary line-clamp-2">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone 4 — Feature Highlights */}
        <div className="border-t-2 border-foreground py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-foreground mb-4">
                  <Icon icon="search" size="sm" />
                </div>
                <h3 className="font-mono font-bold text-foreground uppercase tracking-tight mb-2">
                  Dynamic Discovery
                </h3>
                <p className="text-sm text-foreground-secondary">
                  Omega searches the entire TPMJS registry to find the perfect tools for your task
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-foreground mb-4">
                  <Icon icon="box" size="sm" />
                </div>
                <h3 className="font-mono font-bold text-foreground uppercase tracking-tight mb-2">
                  Sandboxed Execution
                </h3>
                <p className="text-sm text-foreground-secondary">
                  All tools run in a secure sandbox environment for safe execution
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-foreground mb-4">
                  <Icon icon="star" size="sm" />
                </div>
                <h3 className="font-mono font-bold text-foreground uppercase tracking-tight mb-2">
                  Intelligent Synthesis
                </h3>
                <p className="text-sm text-foreground-secondary">
                  Results are combined and presented in a clear, helpful response
                </p>
              </div>
            </div>
            <p className="text-center mt-12 font-mono text-sm text-primary tracking-wide">
              One agent. Infinite capabilities. Zero configuration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

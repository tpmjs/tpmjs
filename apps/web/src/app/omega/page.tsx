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

interface RegistryStats {
  totalTools: number;
  totalPackages: number;
}

/**
 * Omega Landing Page - Modern Agentic Interface
 */
export default function OmegaLandingPage(): React.ReactElement {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [stats, setStats] = useState<RegistryStats | null>(null);

  const isAuthenticated = !!session?.user;

  // Fetch real registry stats
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStats({
            totalTools: data.data.overview.totalTools,
            totalPackages: data.data.overview.totalPackages,
          });
        }
      })
      .catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground selection:bg-primary/30">
      <AppHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden px-4 py-20">
          {/* Subtle ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="mb-8 animate-slide-up">
              <Badge
                variant="secondary"
                className="py-1.5 px-4 rounded-full border border-border/50 bg-surface/50 backdrop-blur-md"
              >
                <Icon icon="terminal" size="xs" className="mr-2 text-primary" />
                <span className="font-medium tracking-wide text-xs uppercase">
                  Omega: The Universal Agent
                </span>
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-slide-up [animation-delay:150ms] [animation-fill-mode:both]">
              One Agent. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Infinite Capabilities.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground-secondary max-w-2xl mb-12 leading-relaxed animate-slide-up [animation-delay:300ms] [animation-fill-mode:both]">
              Powered by the TPMJS infrastructure layer. Describe what you need, and Omega will
              dynamically discover, load, and execute the right tools from the registry to get it
              done.
            </p>

            {/* Input Command Area */}
            <div className="w-full max-w-2xl relative group animate-scale-in [animation-delay:500ms] [animation-fill-mode:both]">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-[24px] blur-lg opacity-40 group-hover:opacity-70 transition duration-500" />
              <div className="relative bg-surface border border-border/50 rounded-[20px] shadow-2xl overflow-hidden backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What would you like to accomplish today?"
                  rows={3}
                  resize="none"
                  className="border-none bg-transparent text-lg p-6 focus:ring-0 placeholder:text-foreground-tertiary"
                  disabled={isCreating}
                />
                <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-border/10">
                  <span className="text-xs text-foreground-tertiary font-medium">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border/50 font-mono text-[10px] shadow-sm">
                      Enter
                    </kbd>{' '}
                    to launch
                  </span>
                  <Button
                    onClick={() => input.trim() && createConversation(input.trim())}
                    disabled={!input.trim() || isCreating}
                    className="rounded-full px-6 shadow-md hover:shadow-primary/25 transition-all"
                  >
                    {isCreating ? (
                      <>
                        <Icon icon="loader" size="xs" className="mr-2 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        Launch Agent <Icon icon="arrowRight" size="xs" className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {!isSessionLoading && !isAuthenticated && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/sign-in?returnTo=${encodeURIComponent('/omega')}`}
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary transition-colors font-medium"
                  >
                    <Icon icon="user" size="xs" />
                    Sign in to save your sessions
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm max-w-2xl w-full mx-auto">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="py-10 border-y border-border/30 bg-surface/20 animate-pulse">
            <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-12 md:gap-32">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2 font-mono">
                  <AnimatedCounter value={stats.totalTools} separator="," duration={2000} />
                </div>
                <div className="text-xs font-semibold text-foreground-tertiary uppercase tracking-widest">
                  Available Tools
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2 font-mono">
                  {stats.totalPackages.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-foreground-tertiary uppercase tracking-widest">
                  NPM Packages
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2 font-mono">&infin;</div>
                <div className="text-xs font-semibold text-foreground-tertiary uppercase tracking-widest">
                  Possibilities
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sample Prompts Grid */}
        <div className="py-24 px-4 md:px-8 max-w-6xl mx-auto w-full">
          <div className="text-center mb-16 animate-slide-up [animation-delay:500ms] [animation-fill-mode:both]">
            <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
              Explore Capabilities
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Not sure where to start? Try one of these examples to see Omega's dynamic tool
              discovery in action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={prompt.title}
                type="button"
                onClick={() => createConversation(prompt.prompt)}
                disabled={isCreating || isSessionLoading}
                className="group relative p-6 bg-surface rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary/5 animate-scale-in [animation-fill-mode:both]"
                style={{ animationDelay: `${700 + i * 100}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center mb-5 group-hover:border-primary/30 group-hover:text-primary transition-colors shadow-sm">
                    <Icon icon={prompt.icon} size="sm" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-lg tracking-tight">
                    {prompt.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-6 flex-1 leading-relaxed">
                    {prompt.description}
                  </p>
                  <div className="text-xs font-semibold text-primary flex items-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Launch scenario <Icon icon="arrowRight" size="xs" className="ml-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-border/30 pt-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="animate-slide-up [animation-delay:700ms] [animation-fill-mode:both]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 text-primary mb-6">
                  <Icon icon="search" size="md" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">
                  Dynamic Discovery
                </h3>
                <p className="text-[15px] text-foreground-secondary leading-relaxed">
                  Omega searches the entire TPMJS registry to find the perfect tools for your task,
                  loading them mid-conversation.
                </p>
              </div>
              <div className="animate-slide-up [animation-delay:850ms] [animation-fill-mode:both]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 text-primary mb-6">
                  <Icon icon="box" size="md" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">
                  Sandboxed Execution
                </h3>
                <p className="text-[15px] text-foreground-secondary leading-relaxed">
                  All tools run in an isolated Deno runtime, ensuring your environment stays secure
                  from untrusted code.
                </p>
              </div>
              <div className="animate-slide-up [animation-delay:1000ms] [animation-fill-mode:both]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 text-primary mb-6">
                  <Icon icon="star" size="md" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">
                  Intelligent Synthesis
                </h3>
                <p className="text-[15px] text-foreground-secondary leading-relaxed">
                  Agentic reasoning combines tool results into clear, actionable responses that move
                  your project forward.
                </p>
              </div>
            </div>
            <p className="text-center mt-20 text-sm font-semibold text-primary tracking-widest uppercase animate-pulse [animation-delay:1200ms] [animation-fill-mode:both]">
              One agent. Every tool. Zero configuration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

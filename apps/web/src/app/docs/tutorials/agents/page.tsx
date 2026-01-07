'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: string;
}

const slides: Slide[] = [
  {
    id: 'intro',
    title: 'Build Your First AI Agent',
    subtitle: 'A step-by-step guide to creating custom AI assistants with TPMJS',
    icon: '🤖',
    content: (
      <div className="text-center space-y-6">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          AI Agents are custom assistants that can use tools from TPMJS to accomplish tasks. In just
          5 steps, you&apos;ll have your own agent up and running.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🔑</span>
            <span className="text-sm">Add API Key</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>✨</span>
            <span className="text-sm">Create Agent</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🔧</span>
            <span className="text-sm">Add Tools</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>💬</span>
            <span className="text-sm">Start Chatting</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'step-1-api-key',
    title: 'Step 1: Get Your API Key',
    subtitle: 'You bring your own AI provider key',
    icon: '🔑',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          TPMJS supports multiple AI providers. Get an API key from any of these:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'OpenAI', url: 'platform.openai.com/api-keys', models: 'GPT-4o, GPT-4 Turbo' },
            {
              name: 'Anthropic',
              url: 'console.anthropic.com/settings/keys',
              models: 'Claude 3.5 Sonnet',
            },
            { name: 'Google', url: 'aistudio.google.com/apikey', models: 'Gemini 2.0 Flash' },
            { name: 'Groq', url: 'console.groq.com/keys', models: 'Llama 3.3 70B' },
            { name: 'Mistral', url: 'console.mistral.ai/api-keys', models: 'Mistral Large' },
          ].map((provider) => (
            <div
              key={provider.name}
              className="p-4 bg-surface-secondary rounded-lg border border-border"
            >
              <h4 className="font-semibold text-foreground">{provider.name}</h4>
              <p className="text-sm text-foreground-tertiary mt-1">{provider.models}</p>
              <a
                href={`https://${provider.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Get key →
              </a>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-foreground-secondary">
            💡 We recommend <strong>OpenAI</strong> or <strong>Anthropic</strong> for the best
            tool-calling support.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-2-add-key',
    title: 'Step 2: Add Your API Key to TPMJS',
    subtitle: 'Your key is encrypted and stored securely',
    icon: '🔐',
    content: (
      <div className="space-y-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <p className="text-foreground font-medium">Go to Settings</p>
              <p className="text-foreground-secondary text-sm">
                Navigate to{' '}
                <span className="font-mono bg-background px-2 py-0.5 rounded">
                  Dashboard → Settings → API Keys
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <p className="text-foreground font-medium">
                Click &quot;Add Key&quot; for your provider
              </p>
              <p className="text-foreground-secondary text-sm">
                Each provider card has an &quot;Add Key&quot; button
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <p className="text-foreground font-medium">Paste your API key and save</p>
              <p className="text-foreground-secondary text-sm">
                Your key is encrypted with AES-256 before storage
              </p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link href="/dashboard/settings/api-keys">
            <Button variant="default">Go to API Keys Settings →</Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: 'step-3-create-agent',
    title: 'Step 3: Create Your Agent',
    subtitle: 'Configure your AI assistant',
    icon: '✨',
    content: (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Basic Info</h4>
            <div className="space-y-3">
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm font-medium text-foreground">Name</p>
                <p className="text-sm text-foreground-tertiary">
                  e.g., &quot;Code Helper&quot;, &quot;Data Analyst&quot;
                </p>
              </div>
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm font-medium text-foreground">Description</p>
                <p className="text-sm text-foreground-tertiary">What does your agent do?</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Model Settings</h4>
            <div className="space-y-3">
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm font-medium text-foreground">Provider & Model</p>
                <p className="text-sm text-foreground-tertiary">
                  Choose from your configured providers
                </p>
              </div>
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-sm font-medium text-foreground">System Prompt</p>
                <p className="text-sm text-foreground-tertiary">
                  Define your agent&apos;s personality &amp; capabilities
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>💡 Tip:</strong> Start with the default settings (temperature 0.7) and adjust
            based on results. Lower temperature = more focused, higher = more creative.
          </p>
        </div>
        <div className="text-center">
          <Link href="/dashboard/agents">
            <Button variant="default">Create an Agent →</Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: 'step-4-add-tools',
    title: 'Step 4: Add Tools to Your Agent',
    subtitle: 'Give your agent superpowers',
    icon: '🔧',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Tools let your agent take actions: run code, search the web, fetch data, and more.
        </p>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-surface-secondary rounded-lg border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-3">📦 Individual Tools</h4>
            <p className="text-foreground-secondary text-sm mb-4">
              Add specific tools one at a time. Great for focused agents.
            </p>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Execute JavaScript/Python</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Fetch web pages</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Web search</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-surface-secondary rounded-lg border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-3">📚 Tool Collections</h4>
            <p className="text-foreground-secondary text-sm mb-4">
              Add entire collections of related tools at once.
            </p>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Pre-curated tool sets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>One-click to add many tools</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Community collections</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center">
          <Link href="/tools">
            <Button variant="secondary">Browse Available Tools →</Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: 'step-5-chat',
    title: 'Step 5: Start Chatting!',
    subtitle: 'Your agent is ready to help',
    icon: '💬',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Click the &quot;Chat&quot; button on your agent to start a conversation. Your agent will
          use its tools to help you.
        </p>
        <div className="max-w-2xl mx-auto bg-surface-secondary rounded-lg border border-border overflow-hidden">
          <div className="p-4 bg-background border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Code Helper</p>
                <p className="text-xs text-foreground-tertiary">OpenAI • GPT-4o</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                <p className="text-sm">
                  Can you run this JavaScript and tell me the result: [1,2,3].map(x =&gt; x * 2)
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-background rounded-lg px-4 py-2 max-w-[80%] border border-border">
                <p className="text-sm text-foreground-secondary mb-2">[Using: code-executor]</p>
                <p className="text-sm text-foreground">
                  The result is <code className="bg-surface-secondary px-1 rounded">[2, 4, 6]</code>{' '}
                  - each element was multiplied by 2.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-foreground text-center">
            🎉 <strong>Conversations are automatically saved</strong> — pick up where you left off
            anytime!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: "You're All Set!",
    subtitle: 'Start building amazing AI agents',
    icon: '🚀',
    content: (
      <div className="space-y-8 text-center">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          You now know everything you need to create powerful AI agents with TPMJS.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/agents">
            <Button size="lg">Create Your First Agent</Button>
          </Link>
          <Link href="/docs/agents">
            <Button variant="secondary" size="lg">
              View Full Documentation
            </Button>
          </Link>
        </div>
        <div className="max-w-2xl mx-auto pt-8 border-t border-border mt-8">
          <h4 className="text-lg font-semibold text-foreground mb-4">What&apos;s Next?</h4>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Use the API</p>
              <p className="text-sm text-foreground-secondary">Integrate agents into your apps</p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Create Collections</p>
              <p className="text-sm text-foreground-secondary">
                Curate tools for specific use cases
              </p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Publish Tools</p>
              <p className="text-sm text-foreground-secondary">
                Add your own tools to the registry
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function AgentsTutorialPage(): React.ReactElement {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(slides.length - 1, index)));
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  if (!slide) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col">
        {/* Navigation header */}
        <div className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/docs/tutorials"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
              <span>Back to Tutorials</span>
            </Link>
            <div className="text-sm text-foreground-secondary">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl">
            {/* Slide header */}
            <div className="text-center mb-12">
              {slide.icon && <span className="text-6xl mb-4 block">{slide.icon}</span>}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{slide.title}</h1>
              {slide.subtitle && (
                <p className="text-lg text-foreground-secondary">{slide.subtitle}</p>
              )}
            </div>

            {/* Slide content */}
            <div className="mb-12">{slide.content}</div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Slide indicators */}
            <div className="flex justify-center gap-2 mb-4">
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide
                      ? 'bg-primary'
                      : index < currentSlide
                        ? 'bg-primary/40'
                        : 'bg-surface-secondary'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="min-w-[120px]"
              >
                <Icon icon="arrowLeft" size="xs" className="mr-2" />
                Previous
              </Button>

              {currentSlide === slides.length - 1 ? (
                <Link href="/dashboard/agents">
                  <Button className="min-w-[120px]">Get Started →</Button>
                </Link>
              ) : (
                <Button onClick={nextSlide} className="min-w-[120px]">
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

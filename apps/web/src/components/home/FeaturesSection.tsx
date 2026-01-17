'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ToolConnectionViz } from './ToolConnectionViz';

// ============================================================================
// Animated Terminal Component
// ============================================================================

function AnimatedTerminal(): React.ReactElement {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const lines = [
    { type: 'input', text: '$ npx @tpmjs/tools-unsandbox' },
    { type: 'output', text: '✓ Tool loaded: executeCodeAsync' },
    { type: 'input', text: '$ execute --lang python --code "print(sum(range(100)))"' },
    { type: 'output', text: '→ Spinning up secure sandbox...' },
    { type: 'output', text: '→ Executing code...' },
    { type: 'success', text: '✓ Output: 4950' },
    { type: 'input', text: '$ _' },
  ];

  useEffect(() => {
    if (currentLine >= lines.length) {
      // Reset after delay
      const timeout = setTimeout(() => {
        setCurrentLine(0);
        setDisplayedText('');
        setIsTyping(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const line = lines[currentLine];
    if (!line) return;

    if (line.type === 'input') {
      // Type out input lines character by character
      let charIndex = 0;
      setIsTyping(true);
      const interval = setInterval(() => {
        if (charIndex <= line.text.length) {
          setDisplayedText(line.text.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setDisplayedText('');
          }, 500);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      // Show output lines instantly
      setDisplayedText(line.text);
      setIsTyping(false);
      const timeout = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
        setDisplayedText('');
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [currentLine]);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input':
        return 'text-foreground';
      case 'output':
        return 'text-foreground-secondary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'text-foreground-secondary';
    }
  };

  return (
    <div className="bg-[#1a1715] rounded-none border-2 border-foreground overflow-hidden shadow-[8px_8px_0_0_rgba(166,89,45,0.3)]">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#2a2520] border-b border-foreground/20">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-error/80" />
          <div className="w-3 h-3 rounded-full bg-warning/80" />
          <div className="w-3 h-3 rounded-full bg-success/80" />
        </div>
        <span className="ml-4 font-mono text-xs text-foreground/40 uppercase tracking-wider">
          tpmjs terminal
        </span>
      </div>

      {/* Terminal Content */}
      <div className="p-6 font-mono text-sm min-h-[280px]">
        {/* Previous lines */}
        {lines.slice(0, currentLine).map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} mb-1`}>
            {line.text}
          </div>
        ))}

        {/* Current line being typed */}
        {currentLine < lines.length && (
          <div className={`${getLineColor(lines[currentLine]?.type || 'input')} flex`}>
            <span>{displayedText}</span>
            {isTyping && (
              <span className="ml-0.5 w-2 h-5 bg-primary animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Feature Card with Hover Animation
// ============================================================================

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  stats?: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, stats, delay = 0 }: FeatureCardProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-6 border-2 border-dashed border-border bg-surface
        transition-all duration-300 ease-out cursor-pointer
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isHovered ? 'border-primary bg-primary/5 shadow-[4px_4px_0_0_rgba(166,89,45,0.2)]' : ''}
      `}
    >
      {/* Animated corner accent */}
      <div
        className={`
          absolute top-0 left-0 w-0 h-0 border-t-[3px] border-l-[3px] border-primary
          transition-all duration-300
          ${isHovered ? 'w-8 h-8' : 'w-0 h-0'}
        `}
      />
      <div
        className={`
          absolute bottom-0 right-0 w-0 h-0 border-b-[3px] border-r-[3px] border-primary
          transition-all duration-300
          ${isHovered ? 'w-8 h-8' : 'w-0 h-0'}
        `}
      />

      {/* Icon */}
      <div
        className={`
          w-12 h-12 flex items-center justify-center mb-4
          border-2 border-dashed transition-all duration-300
          ${isHovered ? 'border-primary bg-primary/10' : 'border-border bg-surface-secondary'}
        `}
      >
        <Icon
          icon={icon as any}
          size="md"
          className={`transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-foreground-secondary'}`}
        />
      </div>

      {/* Content */}
      <h3 className="font-mono text-lg font-semibold mb-2 text-foreground lowercase">
        {title}
      </h3>
      <p className="font-sans text-sm text-foreground-secondary leading-relaxed mb-4">
        {description}
      </p>

      {/* Stats badge */}
      {stats && (
        <Badge
          variant={isHovered ? 'default' : 'outline'}
          size="sm"
          className="transition-all duration-300"
        >
          {stats}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Animated Counter
// ============================================================================

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: AnimatedCounterProps): React.ReactElement {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ============================================================================
// Flow Diagram Component
// ============================================================================

function FlowDiagram(): React.ReactElement {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: 'npm publish', icon: 'box', desc: 'publish to npm' },
    { label: 'auto-discover', icon: 'search', desc: 'indexed in minutes' },
    { label: 'validate', icon: 'check', desc: 'health checks run' },
    { label: 'available', icon: 'globe', desc: 'ready for agents' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          {/* Step */}
          <div
            className={`
              relative flex flex-col items-center p-4 transition-all duration-500
              ${activeStep === i ? 'scale-110' : 'scale-100 opacity-60'}
            `}
          >
            <div
              className={`
                w-16 h-16 flex items-center justify-center border-2 mb-3
                transition-all duration-500
                ${activeStep === i
                  ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(166,89,45,0.3)]'
                  : 'border-dashed border-border bg-surface'
                }
              `}
            >
              <Icon
                icon={step.icon as any}
                size="lg"
                className={`transition-colors duration-500 ${activeStep === i ? 'text-primary' : 'text-foreground-tertiary'}`}
              />
            </div>
            <span className={`font-mono text-sm font-medium transition-colors duration-500 ${activeStep === i ? 'text-primary' : 'text-foreground'}`}>
              {step.label}
            </span>
            <span className="font-mono text-xs text-foreground-tertiary mt-1">
              {step.desc}
            </span>

            {/* Pulse ring when active */}
            {activeStep === i && (
              <div className="absolute inset-0 flex items-start justify-center pt-4">
                <div className="w-16 h-16 border-2 border-primary/50 animate-ping" />
              </div>
            )}
          </div>

          {/* Arrow */}
          {i < steps.length - 1 && (
            <div className="hidden md:flex items-center mx-4">
              <div
                className={`
                  h-0.5 w-12 transition-all duration-500
                  ${activeStep > i ? 'bg-primary' : 'bg-border'}
                `}
              />
              <div
                className={`
                  w-0 h-0 border-t-4 border-b-4 border-l-8
                  border-t-transparent border-b-transparent
                  transition-all duration-500
                  ${activeStep > i ? 'border-l-primary' : 'border-l-border'}
                `}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Interactive Tool Grid
// ============================================================================

function InteractiveToolGrid(): React.ReactElement {
  const tools = [
    { name: 'web-scraper', category: 'web', color: 'bg-info' },
    { name: 'code-executor', category: 'sandbox', color: 'bg-success' },
    { name: 'pdf-parser', category: 'data', color: 'bg-warning' },
    { name: 'image-gen', category: 'ai', color: 'bg-error' },
    { name: 'db-query', category: 'data', color: 'bg-info' },
    { name: 'api-caller', category: 'web', color: 'bg-success' },
    { name: 'file-convert', category: 'utilities', color: 'bg-warning' },
    { name: 'text-analyze', category: 'ai', color: 'bg-error' },
    { name: 'email-send', category: 'integration', color: 'bg-info' },
  ];

  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-2">
      {tools.map((tool, i) => (
        <div
          key={tool.name}
          onMouseEnter={() => setHoveredTool(tool.name)}
          onMouseLeave={() => setHoveredTool(null)}
          className={`
            relative p-3 border border-dashed border-border bg-surface
            transition-all duration-300 cursor-pointer
            ${hoveredTool === tool.name ? 'border-primary scale-105 z-10 shadow-lg' : ''}
          `}
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tool.color}`} />
            <span className="font-mono text-xs truncate">{tool.name}</span>
          </div>
          {hoveredTool === tool.name && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 text-xs font-mono whitespace-nowrap z-20">
              {tool.category}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Features Section
// ============================================================================

export function FeaturesSection(): React.ReactElement {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <Container size="xl" padding="lg" className="relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            everything you need
          </p>
          <h2 className="font-mono text-4xl md:text-5xl font-bold mb-6 text-foreground lowercase tracking-tight">
            powerful features
          </h2>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto font-sans">
            From discovery to execution, TPMJS provides the complete infrastructure
            for AI tool development.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { value: 170, suffix: '+', label: 'tools indexed' },
            { value: 15, suffix: ' min', label: 'discovery time' },
            { value: 99, suffix: '%', label: 'uptime' },
            { value: 4, suffix: '', label: 'mcp clients' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="text-center p-6 border border-dashed border-border bg-surface hover:border-primary transition-colors"
            >
              <div className="font-mono text-4xl md:text-5xl font-bold text-primary mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={1500 + i * 200} />
              </div>
              <div className="font-mono text-sm text-foreground-secondary uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Left: Terminal Demo */}
          <div>
            <fieldset className="border border-dashed border-border p-6">
              <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                live execution
              </legend>
              <p className="font-sans text-sm text-foreground-secondary mb-6">
                Execute any tool directly from your terminal or AI agent. Secure sandboxed
                execution with real-time streaming output.
              </p>
              <AnimatedTerminal />
            </fieldset>
          </div>

          {/* Right: Tool Grid */}
          <div>
            <fieldset className="border border-dashed border-border p-6 h-full">
              <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                tool registry
              </legend>
              <p className="font-sans text-sm text-foreground-secondary mb-6">
                Browse 170+ tools across multiple categories. Each tool is validated,
                documented, and ready to use.
              </p>
              <InteractiveToolGrid />
              <div className="mt-6 flex justify-center">
                <Link href="/tool/tool-search">
                  <Button variant="outline" size="sm">
                    Browse All Tools
                    <Icon icon="chevronRight" size="sm" className="ml-2" />
                  </Button>
                </Link>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Flow Diagram */}
        <fieldset className="border border-dashed border-border p-8 mb-20">
          <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
            how it works
          </legend>
          <FlowDiagram />
        </fieldset>

        {/* Interactive Connection Visualization */}
        <fieldset className="border border-dashed border-border p-8 mb-20 overflow-hidden">
          <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
            tools → tpmjs → agents
          </legend>
          <p className="font-sans text-sm text-foreground-secondary mb-6 text-center max-w-2xl mx-auto">
            TPMJS acts as the central hub connecting npm packages to AI agents.
            Watch data flow in real-time as tools serve agent requests.
          </p>
          <ToolConnectionViz />
        </fieldset>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon="search"
            title="instant discovery"
            description="Tools are automatically discovered from npm within 2-15 minutes. Just add the tpmjs keyword and publish."
            stats="auto-sync"
            delay={0}
          />
          <FeatureCard
            icon="key"
            title="secure execution"
            description="Every tool runs in an isolated Deno sandbox. Rate limiting, timeout handling, and error recovery built-in."
            stats="sandboxed"
            delay={100}
          />
          <FeatureCard
            icon="star"
            title="quality scoring"
            description="Automatic scoring based on documentation, downloads, and health status. Find the best tools instantly."
            stats="0.0 - 1.0"
            delay={200}
          />
          <FeatureCard
            icon="user"
            title="ai agents"
            description="Build custom AI agents with curated tool collections. Share publicly or keep private."
            stats="unlimited"
            delay={300}
          />
          <FeatureCard
            icon="folder"
            title="collections"
            description="Group related tools into collections. Perfect for specific use cases or team workflows."
            stats="shareable"
            delay={400}
          />
          <FeatureCard
            icon="terminal"
            title="rest & mcp api"
            description="Full REST API and MCP protocol support. Works with Claude, Cursor, Windsurf, and any compatible client."
            stats="json-rpc 2.0"
            delay={500}
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link href="/tool/tool-search">
              <Button size="lg" variant="default" className="min-w-[200px]">
                Explore Tools
              </Button>
            </Link>
            <Link href="/publish">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Publish Your Tool
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

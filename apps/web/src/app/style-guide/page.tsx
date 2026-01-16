'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Container } from '@tpmjs/ui/Container/Container';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import {
  FieldsetSection,
  SectionA11yChecklists,
  SectionAccessibility,
  SectionColors,
  SectionComponentAPIs,
  SectionComponents,
  SectionContent,
  SectionContentGuidelines,
  SectionDataViz,
  SectionIconSystem,
  SectionIcons,
  SectionLayout,
  SectionMotion,
  SectionPatternFeedback,
  SectionPatternForms,
  SectionPatternNavigation,
  SectionPatternSearch,
  SectionPatternTables,
  SectionPrinciples,
  SectionSpacing,
  SectionTheming,
  SectionTypography,
} from '~/components/style-guide';

interface NavSection {
  title: string;
  items: { id: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: 'Foundations',
    items: [
      { id: 'principles', label: 'Design Principles' },
      { id: 'colors', label: 'Color System' },
      { id: 'typography', label: 'Typography' },
      { id: 'spacing', label: 'Spacing' },
      { id: 'motion', label: 'Motion' },
    ],
  },
  {
    title: 'Systems',
    items: [
      { id: 'accessibility', label: 'Accessibility' },
      { id: 'layout', label: 'Layout' },
      { id: 'content', label: 'Content' },
      { id: 'data-viz', label: 'Data Visualization' },
      { id: 'icons', label: 'Iconography' },
    ],
  },
  {
    title: 'Implementation',
    items: [
      { id: 'theming', label: 'Theming' },
      { id: 'components', label: 'Components' },
      { id: 'api', label: 'Component APIs' },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { id: 'nav-patterns', label: 'Navigation' },
      { id: 'form-patterns', label: 'Forms' },
      { id: 'feedback-patterns', label: 'Feedback' },
      { id: 'table-patterns', label: 'Tables' },
      { id: 'search-patterns', label: 'Search & Filtering' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { id: 'a11y-checklists', label: 'A11y Checklists' },
      { id: 'content-guidelines', label: 'Content & Writing' },
      { id: 'icon-system', label: 'Icon System' },
    ],
  },
];

export default function StyleGuidePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('all');
  const [radioValue, setRadioValue] = useState('option1');
  const [counterValue, setCounterValue] = useState(1234);
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [activeSection, setActiveSection] = useState('principles');

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = navSections.flatMap((s) => s.items.map((i) => i.id));
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom > 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex">
        {/* Left Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 px-4 border-r border-border">
            <div className="mb-6">
              <h2 className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                Design System
              </h2>
              <div className="flex gap-2">
                <Badge variant="default" size="sm">v2.0</Badge>
                <Badge variant="outline" size="sm">wcag aa</Badge>
              </div>
            </div>

            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                          activeSection === item.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-12">
          <Container size="lg" padding="lg">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-foreground lowercase tracking-tight">
                tpmjs design system
              </h1>
              <p className="font-sans text-lg text-foreground-secondary max-w-2xl leading-relaxed mb-6">
                The comprehensive design system for TPMJS. This guide covers design principles,
                foundations, components, and governance rules that scale across teams, AI agents,
                and external contributors.
              </p>
              <div className="flex flex-wrap gap-3 lg:hidden">
                <Badge variant="default">v2.0</Badge>
                <Badge variant="outline">wcag aa</Badge>
                <Badge variant="outline">dark mode</Badge>
              </div>
            </div>

            {/* Mobile Table of Contents */}
            <FieldsetSection title="table of contents" id="toc" className="lg:hidden">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => scrollToSection(item.id)}
                            className="text-sm text-foreground-secondary hover:text-primary transition-colors"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </FieldsetSection>

            {/* Foundation Sections */}
            <SectionPrinciples />
            <SectionColors />
            <SectionTypography />
            <SectionSpacing />
            <SectionMotion />

            {/* Systems Sections */}
            <SectionAccessibility />
            <SectionLayout density={density} onDensityChange={setDensity} />
            <SectionContent />
            <SectionDataViz counterValue={counterValue} onCounterChange={setCounterValue} />
            <SectionIcons />

            {/* Implementation Sections */}
            <SectionTheming />
            <SectionComponents
              activeTab={activeTab}
              onTabChange={setActiveTab}
              radioValue={radioValue}
              onRadioChange={setRadioValue}
            />
            <SectionComponentAPIs />

            {/* Pattern Library Sections */}
            <SectionPatternNavigation />
            <SectionPatternForms />
            <SectionPatternFeedback />
            <SectionPatternTables />
            <SectionPatternSearch />

            {/* Governance Sections */}
            <SectionA11yChecklists />
            <SectionContentGuidelines />
            <SectionIconSystem />

            {/* Footer */}
            <div className="text-center py-12 border-t border-dashed border-border mt-16">
              <p className="font-mono text-sm text-foreground-secondary">
                tpmjs design system v2.0
              </p>
              <p className="font-sans text-xs text-foreground-tertiary mt-2">
                built with @tpmjs/ui • inspired by turbopuffer.com
              </p>
            </div>
          </Container>
        </main>
      </div>
    </div>
  );
}

'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Container } from '@tpmjs/ui/Container/Container';
import { useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import {
  FieldsetSection,
  NavItem,
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

export default function StyleGuidePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('all');
  const [radioValue, setRadioValue] = useState('option1');
  const [counterValue, setCounterValue] = useState(1234);
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-24">
        <Container size="lg" padding="lg">
          {/* Hero Section */}
          <div className="mb-24">
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-foreground lowercase tracking-tight">
              tpmjs design system
            </h1>
            <p className="font-sans text-lg text-foreground-secondary max-w-2xl leading-relaxed mb-8">
              The comprehensive design system for TPMJS. This guide covers design principles,
              foundations, components, and governance rules that scale across teams, AI agents,
              and external contributors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">v2.0</Badge>
              <Badge variant="outline">wcag aa</Badge>
              <Badge variant="outline">dark mode</Badge>
            </div>
          </div>

          {/* Table of Contents */}
          <FieldsetSection title="table of contents" id="toc">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-3">foundations</p>
                <NavItem href="#principles">1. design principles</NavItem>
                <NavItem href="#colors">2. color system</NavItem>
                <NavItem href="#typography">3. typography</NavItem>
                <NavItem href="#spacing">4. spacing</NavItem>
                <NavItem href="#motion">5. motion</NavItem>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-3">systems</p>
                <NavItem href="#accessibility">6. accessibility</NavItem>
                <NavItem href="#layout">7. layout &amp; responsiveness</NavItem>
                <NavItem href="#content">8. content guidelines</NavItem>
                <NavItem href="#data-viz">9. data visualization</NavItem>
                <NavItem href="#icons">10. iconography</NavItem>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-3">implementation</p>
                <NavItem href="#theming">11. theming</NavItem>
                <NavItem href="#components">12. components</NavItem>
                <NavItem href="#api">13. component apis</NavItem>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-3">patterns</p>
                <NavItem href="#nav-patterns">14. navigation</NavItem>
                <NavItem href="#form-patterns">15. forms</NavItem>
                <NavItem href="#feedback-patterns">16. feedback</NavItem>
                <NavItem href="#table-patterns">17. tables</NavItem>
                <NavItem href="#search-patterns">18. search &amp; filtering</NavItem>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide mb-3">governance</p>
                <NavItem href="#a11y-checklists">19. a11y checklists</NavItem>
                <NavItem href="#content-guidelines">20. content &amp; writing</NavItem>
                <NavItem href="#icon-system">21. icon system</NavItem>
              </div>
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
  );
}

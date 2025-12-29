'use client';

import { useSlideshow } from '@/hooks/useSlideshow';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Slide } from './Slide';
import { SlideNavigation } from './SlideNavigation';
import { SlideProgress } from './SlideProgress';
import { AuthorNextStepsSlide } from './author-slides/AuthorNextStepsSlide';
import { AuthorWelcomeSlide } from './author-slides/AuthorWelcomeSlide';
import { GetDiscoveredSlide } from './author-slides/GetDiscoveredSlide';
import { HealthChecksSlide } from './author-slides/HealthChecksSlide';
import { HowSyncWorksSlide } from './author-slides/HowSyncWorksSlide';
import { PackageSetupSlide } from './author-slides/PackageSetupSlide';
import { QualityScoringSlide } from './author-slides/QualityScoringSlide';
import { ToolDefinitionSlide } from './author-slides/ToolDefinitionSlide';
import { WhatIsRegistrySlide } from './author-slides/WhatIsRegistrySlide';

const SLIDES = [
  { id: 'welcome', Component: AuthorWelcomeSlide },
  { id: 'what-is', Component: WhatIsRegistrySlide },
  { id: 'sync', Component: HowSyncWorksSlide },
  { id: 'setup', Component: PackageSetupSlide },
  { id: 'definition', Component: ToolDefinitionSlide },
  { id: 'quality', Component: QualityScoringSlide },
  { id: 'health', Component: HealthChecksSlide },
  { id: 'discovered', Component: GetDiscoveredSlide },
  { id: 'next-steps', Component: AuthorNextStepsSlide },
];

export function AuthorSlideshow(): React.ReactElement {
  const { currentSlide, totalSlides, next, prev, goTo, direction, isFirst, isLast } = useSlideshow({
    totalSlides: SLIDES.length,
  });

  return (
    <div className="relative h-full w-full bg-[#0a0a0f] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Back button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all text-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tutorials
      </Link>

      {/* Slides */}
      <AnimatePresence mode="wait" custom={direction}>
        {SLIDES.map((slide, index) => (
          <Slide key={slide.id} isActive={index === currentSlide} direction={direction}>
            <slide.Component />
          </Slide>
        ))}
      </AnimatePresence>

      {/* Navigation */}
      <SlideNavigation onNext={next} onPrev={prev} isFirst={isFirst} isLast={isLast} />

      {/* Progress */}
      <SlideProgress currentSlide={currentSlide} totalSlides={totalSlides} goTo={goTo} />

      {/* Keyboard hint */}
      <div className="fixed bottom-8 right-8 z-50 text-white/30 text-xs font-mono">
        Use arrow keys or click to navigate
      </div>
    </div>
  );
}

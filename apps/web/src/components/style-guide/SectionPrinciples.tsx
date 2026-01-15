'use client';

import { FieldsetSection, PrincipleCard, SubSection } from './shared';

export function SectionPrinciples(): React.ReactElement {
  return (
    <FieldsetSection title="1. design principles" id="principles">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        These principles guide every design decision in TPMJS. They ensure consistency
        and prevent drift as the system grows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <PrincipleCard
          icon="terminal"
          title="clarity over decoration"
          description="Every element serves a purpose. Remove anything that doesn't help users accomplish their goals. Developer tools should feel efficient, not playful."
        />
        <PrincipleCard
          icon="box"
          title="mechanical precision"
          description="Sharp corners communicate precision and control. Tools feel engineered, not organic. The interface should feel like a well-built instrument."
        />
        <PrincipleCard
          icon="star"
          title="copper = active signal"
          description="The copper accent (#A6592D) indicates interactivity and importance. It's the 'hot metal' that draws attention to actions and key information."
        />
        <PrincipleCard
          icon="sun"
          title="generous whitespace"
          description="Reduce cognitive load through breathing room. Dense interfaces slow users down. Space creates hierarchy and improves scanability."
        />
        <PrincipleCard
          icon="key"
          title="accessible by default"
          description="WCAG AA compliance is the minimum. Focus states are never removed. Color is never the only indicator of meaning."
        />
        <PrincipleCard
          icon="globe"
          title="developer-first"
          description="The system is built for developers using developer tools. Technical accuracy over marketing speak. Show don't tell."
        />
      </div>

      <SubSection title="design philosophy">
        <div className="bg-surface-2 p-6 border border-dashed border-border prose-width">
          <p className="font-sans text-foreground leading-relaxed mb-4">
            TPMJS is a <strong>developer platform</strong> for AI tools. The design reflects
            this through industrial aesthetics: sharp edges, technical typography, and
            a muted palette with copper as the signal color.
          </p>
          <p className="font-sans text-foreground-secondary leading-relaxed">
            Unlike consumer products that aim for delight, TPMJS aims for
            <strong> efficiency and trust</strong>. Users should feel confident that the
            interface will behave predictably and help them accomplish tasks quickly.
          </p>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}

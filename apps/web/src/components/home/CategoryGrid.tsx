'use client';

import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import type { IconName } from '@tpmjs/ui/Icon/Icon';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useScrollReveal } from '@tpmjs/ui/system/hooks/useScrollReveal';

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  colorClass: string;
  toolCount: number;
  href: string;
}

export interface CategoryGridProps {
  categories: Category[];
}

/**
 * CategoryGrid Component
 *
 * Brutalist masonry-style grid with variable heights and random entrance animations.
 * Each tile has thick borders, hover effects, and intentional chaos.
 */
export function CategoryGrid({ categories }: CategoryGridProps): React.ReactElement {
  // Create random heights for masonry effect (in tailwind classes)
  const heights = ['h-32', 'h-40', 'h-36', 'h-44'] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category, index) => {
        const randomHeight = heights[index % heights.length] || 'h-36';
        // Deterministic delay based on index for stable renders
        const randomDelay = (index * 47) % 400;

        return (
          <CategoryTile
            key={category.id}
            category={category}
            height={randomHeight}
            delay={randomDelay}
          />
        );
      })}
    </div>
  );
}

function CategoryTile({
  category,
  height,
  delay,
}: {
  category: Category;
  height: string;
  delay: number;
}): React.ReactElement {
  const { ref, isVisible } = useScrollReveal<HTMLAnchorElement>({
    threshold: 0.1,
    once: true,
    delay,
  });

  // Deterministic rotation based on delay for stable entrance animation
  // Creates -10 to +10 degrees based on delay value
  const randomRotation = (delay % 20) - 10;

  return (
    <a
      href={category.href}
      ref={ref}
      className="group block"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'rotate(0deg) scale(1)' : `rotate(${randomRotation}deg) scale(0.8)`,
        transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <Card
        variant="brutalist"
        padding="none"
        className={`${height} relative overflow-hidden cursor-pointer
          hover:border-[8px] hover:-translate-y-1 hover:rotate-[-2deg]
          active:translate-y-0 active:rotate-0
          transition-all duration-200`}
      >
        <CardContent
          className={`${category.colorClass} h-full p-6 flex flex-col justify-between relative`}
        >
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                   linear-gradient(45deg, currentColor 25%, transparent 25%),
                   linear-gradient(-45deg, currentColor 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, currentColor 75%),
                   linear-gradient(-45deg, transparent 75%, currentColor 75%)
                 `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <Icon icon={category.icon} size="lg" className="mb-3" />
            <h3 className="font-bold text-lg uppercase tracking-tight leading-tight">
              {category.name}
            </h3>
          </div>

          {/* Tool Count with Arrow */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums">{category.toolCount}</span>
            <span className="text-4xl group-hover:translate-x-1 transition-transform duration-200">
              ▸
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

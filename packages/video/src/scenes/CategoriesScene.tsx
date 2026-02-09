import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 11: Categories (4:20 - 4:35)
 * 8-category grid with tool counts
 */

const CategoryCard = ({
  icon,
  name,
  count,
  delay,
  index,
}: {
  icon: string;
  name: string;
  count: number;
  delay: number;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  // Subtle float animation
  const float = Math.sin((frame + index * 20) * 0.04) * 3;

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [40, 0]) + float}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        padding: 24,
        width: 240,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hover accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: colors.copper.default,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left',
        }}
      />

      {/* Icon */}
      <div
        style={{
          fontSize: 40,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: 8,
        }}
      >
        {name}
      </div>

      {/* Count */}
      <div
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.copper.default,
        }}
      >
        {count} tools
      </div>
    </div>
  );
};

export const CategoriesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const categories = [
    { icon: '🔗', name: 'Integration', count: 45 },
    { icon: '📝', name: 'Text Analysis', count: 32 },
    { icon: '💻', name: 'Code Gen', count: 28 },
    { icon: '🔍', name: 'Search', count: 24 },
    { icon: '📊', name: 'Data', count: 21 },
    { icon: '🖼', name: 'Media', count: 18 },
    { icon: '🔐', name: 'Security', count: 12 },
    { icon: '🛠', name: 'Utility', count: 5 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleProgress,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          <span style={{ color: colors.copper.default }}>185+</span> tools across{' '}
          <span style={{ color: colors.copper.default }}>8</span> categories
        </div>
      </div>

      {/* Category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          marginTop: 40,
        }}
      >
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.name}
            icon={cat.icon}
            name={cat.name}
            count={cat.count}
            delay={fps * 0.3 + i * 6}
            index={i}
          />
        ))}
      </div>

      {/* Growing text */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [fps * 3, fps * 4], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.xl,
            color: colors.text.secondary,
          }}
        >
          And growing every day through{' '}
          <span
            style={{
              color: colors.copper.default,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            npm auto-sync
          </span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

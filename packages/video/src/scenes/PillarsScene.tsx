import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 4: The Three Pillars (0:50 - 1:30)
 * DISCOVER, EXECUTE, CONNECT cards
 */

const PillarCard = ({
  icon,
  title,
  subtitle,
  detail,
  delay,
  color,
}: {
  icon: string;
  title: string;
  subtitle: string;
  detail: string;
  delay: number;
  color: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.default,
  });

  const float = Math.sin((frame + delay) * 0.05) * 4;

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [60, 0]) + float}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        padding: 40,
        width: 360,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: color,
        }}
      />

      {/* Icon */}
      <div style={{ fontSize: 48, marginBottom: 20 }}>{icon}</div>

      {/* Title */}
      <div
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: typography.fontSize.lg,
          color: color,
          fontWeight: typography.fontWeight.medium,
          marginBottom: 16,
        }}
      >
        {subtitle}
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: typography.fontSize.base,
          color: colors.text.tertiary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

export const PillarsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillars = [
    {
      icon: '📦',
      title: 'DISCOVER',
      subtitle: '185+ tools ready to use',
      detail: 'Auto-synced from npm every 2 minutes',
      color: colors.copper.default,
      delay: fps * 0.3,
    },
    {
      icon: '⚡',
      title: 'EXECUTE',
      subtitle: 'Sandboxed runtime',
      detail: '42+ programming languages supported',
      color: colors.status.success,
      delay: fps * 0.6,
    },
    {
      icon: '🔗',
      title: 'CONNECT',
      subtitle: 'MCP Protocol',
      detail: 'Works with Claude, GPT, Cursor & more',
      color: colors.status.info,
      delay: fps * 0.9,
    },
  ];

  // Summary text
  const summaryProgress = interpolate(frame, [fps * 5, fps * 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginBottom: 80,
        }}
      >
        {pillars.map((pillar, i) => (
          <PillarCard key={i} {...pillar} />
        ))}
      </div>

      {/* Summary */}
      <div
        style={{
          textAlign: 'center',
          opacity: summaryProgress,
          transform: `translateY(${interpolate(summaryProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: 8,
          }}
        >
          One platform.
        </div>
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.copper.default,
          }}
        >
          Every AI tool. Any framework.
        </div>
      </div>
    </AbsoluteFill>
  );
};

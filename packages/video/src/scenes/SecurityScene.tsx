import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 12: Security (4:35 - 4:45)
 * Enterprise-grade security features
 */

const SecurityFeature = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-30, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          backgroundColor: colors.bg.surface2,
          border: `1px solid ${colors.copper.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.tertiary,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

export const SecurityScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const features = [
    {
      icon: '🔒',
      title: 'Sandboxed Execution',
      description: 'Every tool runs in isolated containers',
    },
    {
      icon: '✅',
      title: 'Quality Scoring',
      description: 'Automated validation and trust metrics',
    },
    {
      icon: '📊',
      title: 'Usage Analytics',
      description: 'Track tool performance and reliability',
    },
    {
      icon: '🛡',
      title: 'Zero Trust',
      description: 'Network isolation by default',
    },
  ];

  // Shield pulse animation
  const pulse = Math.sin(frame * 0.1) * 0.1 + 1;

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
          top: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleProgress,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.copper.default,
            letterSpacing: typography.letterSpacing.widest,
            marginBottom: 12,
          }}
        >
          ENTERPRISE READY
        </div>
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Security you can trust
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 120,
          alignItems: 'center',
          marginTop: 60,
        }}
      >
        {/* Features list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          {features.map((feature, i) => (
            <SecurityFeature
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={fps * 0.5 + i * 12}
            />
          ))}
        </div>

        {/* Large shield icon */}
        <div
          style={{
            opacity: interpolate(frame, [fps * 1, fps * 2], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${pulse})`,
          }}
        >
          <div
            style={{
              width: 200,
              height: 240,
              backgroundColor: colors.bg.surface,
              border: `2px solid ${colors.copper.default}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          >
            <div
              style={{
                fontSize: 80,
                color: colors.copper.default,
              }}
            >
              🛡
            </div>
            {/* Glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: -20,
                background: `radial-gradient(circle, ${colors.copper.glow} 0%, transparent 70%)`,
                opacity: 0.5,
                zIndex: -1,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

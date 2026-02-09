import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Features Closing Scene (1:22 - 1:30)
 * Call to action with tpmjs.com
 */
export const FeaturesClosingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // All features revealed
  const gridProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  // URL animation
  const urlProgress = spring({
    frame: frame - fps * 1.5,
    fps,
    config: springConfigs.bouncy,
  });

  // CTA animation
  const ctaProgress = spring({
    frame: frame - fps * 3,
    fps,
    config: springConfigs.snappy,
  });

  const features = [
    'Tool Registry',
    'Omega Agent',
    'Collections',
    'Custom Agents',
    'MCP Protocol',
    'Secure Execution',
    'Test Scenarios',
    'Living Skills',
    'Developer SDK',
  ];

  // Pulsing glow
  const glowIntensity = Math.sin(frame * 0.08) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Radial gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.copper.glow} 0%, transparent 60%)`,
          opacity: 0.2 * glowIntensity,
        }}
      />

      {/* Features grid (small) */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '0 200px',
          opacity: gridProgress,
        }}
      >
        {features.map((feature, _i) => (
          <div
            key={feature}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.bg.surface,
              border: `1px dashed ${colors.border.default}`,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.mono,
              textTransform: 'lowercase',
            }}
          >
            {feature}
          </div>
        ))}
      </div>

      {/* Main CTA */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: 32,
            opacity: urlProgress,
            transform: `translateY(${interpolate(urlProgress, [0, 1], [30, 0])}px)`,
          }}
        >
          Start building with AI tools
        </div>

        {/* URL box */}
        <div
          style={{
            display: 'inline-block',
            padding: '24px 48px',
            backgroundColor: colors.bg.surface,
            border: `2px solid ${colors.copper.default}`,
            marginBottom: 32,
            opacity: urlProgress,
            transform: `scale(${interpolate(urlProgress, [0, 1], [0.9, 1])})`,
            boxShadow: `0 0 ${40 * glowIntensity}px ${colors.copper.glow}`,
          }}
        >
          <div
            style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize['5xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.copper.default,
            }}
          >
            tpmjs.com
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            opacity: ctaProgress,
            transform: `translateY(${interpolate(ctaProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              padding: '16px 32px',
              backgroundColor: colors.copper.default,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.white,
            }}
          >
            Try Omega Agent
          </div>
          <div
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border.default}`,
              fontSize: typography.fontSize.lg,
              color: colors.text.secondary,
            }}
          >
            Read the Docs
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [fps * 5, fps * 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          The Package Manager for AI Tools
        </span>
      </div>
    </AbsoluteFill>
  );
};

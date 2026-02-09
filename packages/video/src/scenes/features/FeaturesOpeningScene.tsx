import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Features Opening Scene (0:00 - 0:06)
 * Bold intro with TPMJS branding and tagline
 */
export const FeaturesOpeningScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: springConfigs.bouncy,
  });

  const logoRotate = interpolate(frame, [0, fps * 0.5], [-10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - fps * 1,
    fps,
    config: springConfigs.smooth,
  });

  // Feature count animation
  const countProgress = spring({
    frame: frame - fps * 2,
    fps,
    config: springConfigs.snappy,
  });

  const featureCount = Math.floor(
    interpolate(frame, [fps * 2, fps * 3.5], [0, 9], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Copper line sweep
  const lineWidth = interpolate(frame, [fps * 3, fps * 5], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
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
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.copper.glow} 0%, transparent 70%)`,
          opacity: 0.15,
        }}
      />

      {/* Main content */}
      <div style={{ textAlign: 'center' }}>
        {/* Logo/Brand */}
        <div
          style={{
            fontSize: typography.fontSize['8xl'],
            fontWeight: typography.fontWeight.bold,
            fontFamily: typography.fontFamily.mono,
            color: colors.text.primary,
            letterSpacing: typography.letterSpacing.tight,
            transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
            marginBottom: 24,
          }}
        >
          <span style={{ color: colors.copper.default }}>tpm</span>js
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: typography.fontSize['2xl'],
            color: colors.text.secondary,
            opacity: taglineProgress,
            transform: `translateY(${interpolate(taglineProgress, [0, 1], [20, 0])}px)`,
            marginBottom: 48,
          }}
        >
          The Package Manager for AI Tools
        </div>

        {/* Feature count */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 32px',
            backgroundColor: colors.bg.surface,
            border: `2px solid ${colors.copper.default}`,
            opacity: countProgress,
            transform: `scale(${interpolate(countProgress, [0, 1], [0.9, 1])})`,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.mono,
              color: colors.copper.default,
            }}
          >
            {featureCount}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.xl,
              color: colors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
            }}
          >
            Core Features
          </span>
        </div>
      </div>

      {/* Bottom copper line */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${lineWidth}%`,
          height: 3,
          backgroundColor: colors.copper.default,
          boxShadow: `0 0 30px ${colors.copper.glow}`,
        }}
      />
    </AbsoluteFill>
  );
};

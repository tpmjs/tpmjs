import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 14: Closing (4:55 - 5:00)
 * Logo, tagline, and URL
 */
export const ClosingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: springConfigs.bouncy,
  });

  // Tagline animation
  const taglineProgress = spring({
    frame: frame - fps * 0.8,
    fps,
    config: springConfigs.smooth,
  });

  // URL animation
  const urlProgress = spring({
    frame: frame - fps * 1.5,
    fps,
    config: springConfigs.snappy,
  });

  // Copper line expansion
  const lineProgress = interpolate(frame, [fps * 0.5, fps * 1.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Particle burst effect
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = interpolate(frame, [0, fps * 0.5], [0, 150], {
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(frame, [fps * 0.3, fps * 1], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity,
    };
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
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${colors.copper.glow} 0%, transparent 60%)`,
          opacity: interpolate(frame, [0, fps * 2], [0, 0.6], {
            extrapolateRight: 'clamp',
          }),
        }}
      />

      {/* Particle burst */}
      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: colors.copper.default,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            opacity: particle.opacity,
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.5, 1])})`,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['9xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            letterSpacing: typography.letterSpacing.tight,
            lineHeight: 1,
          }}
        >
          <span style={{ color: colors.copper.default }}>TPM</span>JS
        </div>
      </div>

      {/* Copper line */}
      <div
        style={{
          width: 200,
          height: 4,
          backgroundColor: colors.copper.default,
          marginTop: 24,
          marginBottom: 24,
          transform: `scaleX(${lineProgress})`,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: taglineProgress,
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [20, 0])}px)`,
          marginBottom: 48,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize['3xl'],
            color: colors.text.secondary,
          }}
        >
          The npm for AI tools
        </span>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlProgress,
          transform: `translateY(${interpolate(urlProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: colors.bg.surface,
            border: `2px solid ${colors.copper.default}`,
            padding: '20px 48px',
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize['2xl'],
              fontFamily: typography.fontFamily.mono,
              color: colors.copper.default,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            tpmjs.com
          </span>
        </div>
      </div>

      {/* Bottom taglines */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
          opacity: interpolate(frame, [fps * 2.5, fps * 3.5], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
          }}
        >
          185+ tools
        </div>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
          }}
        >
          42+ languages
        </div>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
          }}
        >
          Open source
        </div>
      </div>
    </AbsoluteFill>
  );
};

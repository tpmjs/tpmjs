import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography } from '../design-tokens';

/**
 * Scene 3: Introducing TPMJS (0:30 - 0:50)
 * Logo reveal with particle burst
 */
export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo scale with bounce
  const logoProgress = spring({
    frame: frame - fps * 0.3,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Tagline fade
  const taglineProgress = interpolate(frame, [fps * 1.5, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle
  const subtitleProgress = interpolate(frame, [fps * 3, fps * 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Particle burst
  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const distance = spring({
      frame: frame - fps * 0.5,
      fps,
      config: { damping: 25 },
    });
    const opacity = interpolate(frame - fps * 0.5, [0, fps * 0.5, fps * 2], [0, 0.8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      x: Math.cos(angle) * distance * 250,
      y: Math.sin(angle) * distance * 250,
      opacity,
      size: 4 + (i % 4) * 2,
    };
  });

  // Glow pulse
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.4, 0.7]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.copper.glow} 0%, transparent 50%)`,
          opacity: 0.3,
        }}
      />

      {/* Particles */}
      <div
        style={{
          position: 'absolute',
          left: width / 2,
          top: height / 2 - 40,
        }}
      >
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: colors.copper.default,
              opacity: p.opacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoProgress})`,
          opacity: logoProgress,
          position: 'relative',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            inset: -60,
            background: `radial-gradient(circle, ${colors.copper.default}50 0%, transparent 70%)`,
            opacity: glowPulse,
            filter: 'blur(30px)',
          }}
        />

        {/* Icon + Text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* Package icon */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 0, // Brutalist
              backgroundColor: colors.copper.default,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 20px 40px ${colors.copper.glow}`,
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.white}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          {/* Brand name */}
          <span
            style={{
              fontSize: 120,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            TPMJS
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 40,
          opacity: taglineProgress,
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.medium,
            color: colors.copper.default,
            letterSpacing: typography.letterSpacing.wide,
          }}
        >
          Tools Package Manager for JavaScript
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 20,
          opacity: subtitleProgress,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.xl,
            color: colors.text.secondary,
          }}
        >
          The npm for AI tools.
        </span>
      </div>
    </AbsoluteFill>
  );
};

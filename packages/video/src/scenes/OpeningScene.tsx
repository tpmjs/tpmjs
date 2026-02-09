import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, typography } from '../design-tokens';

/**
 * Scene 1: Opening Impact (0:00 - 0:10)
 * Dark screen → copper line draws → text fades in
 */
export const OpeningScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Copper line animation
  const lineProgress = interpolate(frame, [fps * 1, fps * 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Text reveal
  const line1Opacity = interpolate(frame, [fps * 3.5, fps * 4.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const line2Opacity = interpolate(frame, [fps * 5, fps * 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const line1Y = interpolate(frame, [fps * 3.5, fps * 4.5], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const line2Y = interpolate(frame, [fps * 5, fps * 6], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Subtle grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Copper accent line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${lineProgress * 400}px`,
          height: 2,
          backgroundColor: colors.copper.default,
          boxShadow: `0 0 20px ${colors.copper.glow}`,
          marginTop: -80,
        }}
      />

      {/* Main text */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.light,
            color: colors.text.primary,
            letterSpacing: typography.letterSpacing.tight,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          What if every AI tool
        </div>
        <div
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.copper.default,
            letterSpacing: typography.letterSpacing.tight,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            marginTop: 16,
          }}
        >
          was just one command away?
        </div>
      </div>
    </AbsoluteFill>
  );
};

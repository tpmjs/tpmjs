import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 2: The Problem (0:10 - 0:30)
 * Pain points with shake/glitch effects
 */
export const ProblemScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problems = [
    { icon: '❌', text: 'Write boilerplate for every tool' },
    { icon: '❌', text: 'No standard format' },
    { icon: '❌', text: 'Hard to discover' },
    { icon: '❌', text: 'Impossible to share' },
    { icon: '❌', text: 'Manual documentation' },
    { icon: '❌', text: 'Framework lock-in' },
  ];

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.snappy,
  });

  // Glitch effect on title
  const glitchActive = random(`glitch-${Math.floor(frame / 3)}`) > 0.9;
  const glitchX = glitchActive ? (random(`gx-${frame}`) - 0.5) * 8 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
      }}
    >
      {/* Subtle red glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.status.errorMuted} 0%, transparent 60%)`,
          opacity: 0.5,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: typography.fontSize['6xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: 60,
          opacity: titleProgress,
          transform: `translateX(${glitchX}px)`,
        }}
      >
        Building AI tools is <span style={{ color: colors.status.error }}>painful.</span>
      </div>

      {/* Problem list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {problems.map((problem, i) => {
          const itemProgress = spring({
            frame: frame - fps * 0.5 - i * 8,
            fps,
            config: springConfigs.snappy,
          });

          const shake =
            frame > fps * 0.5 + i * 8 + fps * 0.3 && frame < fps * 0.5 + i * 8 + fps * 0.5
              ? Math.sin(frame * 3) * 3
              : 0;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                opacity: itemProgress,
                transform: `translateX(${interpolate(itemProgress, [0, 1], [-40, 0]) + shake}px)`,
              }}
            >
              <span style={{ fontSize: 28 }}>{problem.icon}</span>
              <span
                style={{
                  fontSize: typography.fontSize['2xl'],
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {problem.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

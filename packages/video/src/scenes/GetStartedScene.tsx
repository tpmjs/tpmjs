import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 13: Get Started (4:45 - 4:55)
 * Three paths: CLI, Web, MCP
 */

const PathCard = ({
  number,
  title,
  command,
  delay,
}: {
  number: number;
  title: string;
  command: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.bouncy,
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px) scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        padding: 32,
        width: 340,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Number badge */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 40,
          backgroundColor: colors.copper.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: colors.white,
        }}
      >
        {number}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          marginTop: 16,
          marginBottom: 20,
        }}
      >
        {title}
      </div>

      {/* Command */}
      <div
        style={{
          backgroundColor: colors.bg.surface2,
          border: `1px solid ${colors.border.subtle}`,
          padding: '12px 20px',
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.sm,
          color: colors.copper.default,
        }}
      >
        {command}
      </div>
    </div>
  );
};

export const GetStartedScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const paths = [
    {
      number: 1,
      title: 'Install CLI',
      command: 'npm i -g @tpmjs/cli',
    },
    {
      number: 2,
      title: 'Browse Web',
      command: 'tpmjs.com',
    },
    {
      number: 3,
      title: 'Connect MCP',
      command: 'tpmjs.com/api/mcp/sse',
    },
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
          top: 140,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleProgress,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Get started in <span style={{ color: colors.copper.default }}>60 seconds</span>
        </div>
      </div>

      {/* Path cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 80,
        }}
      >
        {paths.map((path, i) => (
          <PathCard
            key={path.title}
            number={path.number}
            title={path.title}
            command={path.command}
            delay={fps * 0.5 + i * 15}
          />
        ))}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [fps * 2.5, fps * 3.5], [0, 1], {
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
          Choose your path. They all lead to{' '}
          <span
            style={{
              color: colors.copper.default,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            185+ tools
          </span>
          .
        </span>
      </div>
    </AbsoluteFill>
  );
};

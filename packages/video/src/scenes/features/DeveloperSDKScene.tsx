import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Feature 9: Developer SDK (1:13 - 1:22)
 * Publish tools with one keyword, TypeScript support
 */

const CodeLine = ({
  content,
  indent = 0,
  delay,
  highlight = false,
}: {
  content: string;
  indent?: number;
  delay: number;
  highlight?: boolean;
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
        fontFamily: typography.fontFamily.mono,
        fontSize: typography.fontSize.base,
        color: highlight ? colors.copper.default : colors.text.primary,
        paddingLeft: indent * 24,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-10, 0])}px)`,
        lineHeight: typography.lineHeight.relaxed,
      }}
    >
      {content}
    </div>
  );
};

export const DeveloperSDKScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const codeLines = [
    { content: '// package.json', indent: 0, highlight: false },
    { content: '{', indent: 0, highlight: false },
    { content: '"name": "my-awesome-tool",', indent: 1, highlight: false },
    { content: '"keywords": ["tpmjs"],', indent: 1, highlight: true },
    { content: '"tpmjs": {', indent: 1, highlight: true },
    { content: '"tools": ["./src/tools.ts"]', indent: 2, highlight: true },
    { content: '}', indent: 1, highlight: false },
    { content: '}', indent: 0, highlight: false },
  ];

  const features = [
    'TypeScript support',
    'AI SDK integration',
    'Auto schema extraction',
    'Zero config publish',
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        fontFamily: typography.fontFamily.sans,
        padding: 80,
      }}
    >
      {/* Feature badge */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: headerProgress,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.copper.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {'</>'}
        </div>
        <div>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.copper.default,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            }}
          >
            Feature 09
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Developer SDK
          </div>
        </div>
        <div
          style={{
            marginLeft: 16,
            padding: '4px 12px',
            backgroundColor: colors.status.errorMuted,
            border: `1px solid ${colors.status.error}`,
            fontSize: typography.fontSize.xs,
            color: colors.status.error,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          npm
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          gap: 80,
          marginTop: 160,
          alignItems: 'flex-start',
        }}
      >
        {/* Left - Code block */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              padding: 24,
              maxWidth: 500,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: colors.status.error,
                  opacity: 0.5,
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: colors.status.warning,
                  opacity: 0.5,
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: colors.status.success,
                  opacity: 0.5,
                }}
              />
            </div>
            {codeLines.map((line, i) => (
              <CodeLine key={line.text} {...line} delay={fps * 0.5 + i * 5} />
            ))}
          </div>

          {/* npm publish command */}
          <div
            style={{
              marginTop: 24,
              padding: '16px 24px',
              backgroundColor: colors.bg.surface2,
              border: `1px dashed ${colors.border.default}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              opacity: interpolate(frame, [fps * 3, fps * 4], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span style={{ color: colors.status.success }}>$</span>
            <span
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.lg,
                color: colors.text.primary,
              }}
            >
              npm publish
            </span>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              → auto-discovered in minutes
            </span>
          </div>
        </div>

        {/* Right - Features */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: 32,
              opacity: headerProgress,
            }}
          >
            One keyword.
            <br />
            <span style={{ color: colors.copper.default }}>Instant discovery.</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {features.map((feature, i) => {
              const featureProgress = spring({
                frame: frame - fps * 2 - i * 8,
                fps,
                config: springConfigs.snappy,
              });

              return (
                <div
                  key={feature}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    opacity: featureProgress,
                    transform: `translateX(${interpolate(featureProgress, [0, 1], [20, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.status.successMuted,
                      border: `1px solid ${colors.status.success}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.sm,
                      color: colors.status.success,
                    }}
                  >
                    ✓
                  </div>
                  <span
                    style={{
                      fontSize: typography.fontSize.lg,
                      color: colors.text.secondary,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 8: Collections (3:00 - 3:20)
 * Create and share tool collections
 */
export const CollectionsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const tools = ['firecrawl-aisdk', 'page-brief', 'search', 'sentiment-analysis'];

  const urlProgress = spring({
    frame: frame - fps * 3,
    fps,
    config: springConfigs.default,
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
          COLLECTIONS
        </div>
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Curate your own tool sets
        </div>
      </div>

      {/* Collection card */}
      <div
        style={{
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.border.default}`,
          width: 600,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 28 }}>📁</span>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Web Research Kit
            </div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              4 tools • Public collection
            </div>
          </div>
        </div>

        {/* Tools list */}
        <div style={{ padding: 24 }}>
          {tools.map((tool, i) => {
            const toolProgress = spring({
              frame: frame - fps * 0.5 - i * 10,
              fps,
              config: springConfigs.snappy,
            });
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: i < tools.length - 1 ? `1px solid ${colors.border.subtle}` : 'none',
                  opacity: toolProgress,
                  transform: `translateX(${interpolate(toolProgress, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.copper.default,
                  }}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.mono,
                  }}
                >
                  {tool}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MCP Endpoint URL */}
      <div
        style={{
          marginTop: 40,
          opacity: urlProgress,
          transform: `translateY(${interpolate(urlProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Share as MCP endpoint:
        </div>
        <div
          style={{
            backgroundColor: colors.bg.surface2,
            border: `1px solid ${colors.copper.default}`,
            padding: '16px 32px',
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.sm,
            color: colors.copper.default,
          }}
        >
          https://tpmjs.com/api/mcp/you/web-research-kit/sse
        </div>
      </div>
    </AbsoluteFill>
  );
};

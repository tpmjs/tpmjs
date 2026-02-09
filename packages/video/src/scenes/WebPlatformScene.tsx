import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 7: The Web Platform (2:40 - 3:00)
 * tpmjs.com interface showcase
 */

const ToolCard = ({
  name,
  category,
  score,
  downloads,
  delay,
}: {
  name: string;
  category: string;
  score: number;
  downloads: string;
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
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        padding: 20,
        width: 280,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {name}
        </div>
        <div
          style={{
            backgroundColor: colors.copper.default,
            color: colors.white,
            padding: '4px 8px',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {score.toFixed(1)}
        </div>
      </div>
      <div
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.copper.muted,
          marginBottom: 8,
        }}
      >
        {category}
      </div>
      <div
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.muted,
        }}
      >
        {downloads} downloads/mo
      </div>
    </div>
  );
};

export const WebPlatformScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const tools = [
    { name: 'firecrawl-aisdk', category: 'integration', score: 0.92, downloads: '45.2K' },
    { name: 'sentiment-analysis', category: 'text-analysis', score: 0.88, downloads: '32.1K' },
    { name: 'unsandbox', category: 'code-generation', score: 0.95, downloads: '28.7K' },
    { name: 'page-brief', category: 'integration', score: 0.85, downloads: '21.3K' },
  ];

  const features = [
    'Browse 185+ tools',
    'Filter by category',
    'Sort by quality score',
    'One-click MCP integration',
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
      {/* Browser mockup */}
      <div
        style={{
          width: 1200,
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.border.default}`,
          overflow: 'hidden',
          opacity: headerProgress,
          transform: `scale(${interpolate(headerProgress, [0, 1], [0.95, 1])})`,
        }}
      >
        {/* Browser header */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: colors.bg.surface2,
            borderBottom: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }}
            />
            <div
              style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }}
            />
            <div
              style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }}
            />
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: colors.bg.surface3,
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            tpmjs.com
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 40 }}>
          {/* Logo */}
          <div
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: 32,
            }}
          >
            <span style={{ color: colors.copper.default }}>TPMJS</span>
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: colors.bg.surface2,
                border: `1px solid ${colors.border.default}`,
                padding: '12px 20px',
                fontSize: typography.fontSize.base,
                color: colors.text.muted,
              }}
            >
              Search tools...
            </div>
            <div
              style={{
                backgroundColor: colors.copper.default,
                color: colors.white,
                padding: '12px 24px',
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Search
            </div>
          </div>

          {/* Tool cards */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginBottom: 32,
            }}
          >
            {tools.map((tool, i) => (
              <ToolCard key={i} {...tool} delay={fps * 0.3 + i * 8} />
            ))}
          </div>
        </div>
      </div>

      {/* Features list */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginTop: 40,
        }}
      >
        {features.map((feature, i) => {
          const featureProgress = spring({
            frame: frame - fps * 1 - i * 10,
            fps,
            config: springConfigs.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: featureProgress,
              }}
            >
              <span style={{ color: colors.status.success, fontSize: 20 }}>✓</span>
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
    </AbsoluteFill>
  );
};

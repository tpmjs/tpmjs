import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 9: MCP Integration (3:20 - 3:50)
 * Claude Desktop and Cursor IDE integration
 */
export const MCPScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  // Claude Desktop config
  const claudeProgress = spring({
    frame: frame - fps * 0.5,
    fps,
    config: springConfigs.default,
  });

  // Cursor config
  const cursorProgress = spring({
    frame: frame - fps * 2,
    fps,
    config: springConfigs.default,
  });

  // Connection animation
  const connectionProgress = spring({
    frame: frame - fps * 4,
    fps,
    config: springConfigs.bouncy,
  });

  const claudeConfig = `{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/claude-mcp",
        "https://tpmjs.com/api/mcp/sse"]
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "tpmjs": {
      "url": "https://tpmjs.com/api/mcp/sse"
    }
  }
}`;

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
          top: 80,
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
          MCP PROTOCOL
        </div>
        <div
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Works with your existing tools
        </div>
      </div>

      {/* Config cards */}
      <div
        style={{
          display: 'flex',
          gap: 60,
          marginTop: 40,
        }}
      >
        {/* Claude Desktop */}
        <div
          style={{
            opacity: claudeProgress,
            transform: `translateX(${interpolate(claudeProgress, [0, 1], [-40, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#CC785C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              C
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Claude Desktop
            </span>
          </div>

          <div
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              padding: 20,
              width: 500,
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
                marginBottom: 8,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              claude_desktop_config.json
            </div>
            <pre
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
                margin: 0,
                whiteSpace: 'pre',
              }}
            >
              {claudeConfig}
            </pre>
          </div>
        </div>

        {/* Cursor IDE */}
        <div
          style={{
            opacity: cursorProgress,
            transform: `translateX(${interpolate(cursorProgress, [0, 1], [40, 0])}px)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#00D1FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: colors.black,
              }}
            >
              {'</>'}
            </div>
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              Cursor IDE
            </span>
          </div>

          <div
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              padding: 20,
              width: 500,
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
                marginBottom: 8,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              .cursor/mcp.json
            </div>
            <pre
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
                margin: 0,
                whiteSpace: 'pre',
              }}
            >
              {cursorConfig}
            </pre>
          </div>
        </div>
      </div>

      {/* Connection indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          alignItems: 'center',
          opacity: connectionProgress,
          transform: `scale(${interpolate(connectionProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.status.success,
              boxShadow: `0 0 20px ${colors.status.success}`,
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.text.secondary,
            }}
          >
            185+ tools instantly available
          </span>
        </div>
        <div
          style={{
            width: 1,
            height: 24,
            backgroundColor: colors.border.default,
          }}
        />
        <span
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.copper.default,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Zero configuration required
        </span>
      </div>
    </AbsoluteFill>
  );
};

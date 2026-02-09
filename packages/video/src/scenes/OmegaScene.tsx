import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 10: Omega Agent (3:50 - 4:20)
 * Chat interface with smart tool selection
 */

const ChatMessage = ({
  role,
  content,
  delay,
  typing = false,
}: {
  role: 'user' | 'assistant';
  content: string;
  delay: number;
  typing?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  // Typing animation for assistant messages
  const adjustedFrame = Math.max(0, frame - delay - fps * 0.3);
  const typedContent = typing
    ? content.slice(0, Math.min(content.length, Math.floor(adjustedFrame / 1.5)))
    : content;

  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 500,
          padding: '16px 20px',
          backgroundColor: isUser ? colors.copper.default : colors.bg.surface2,
          border: isUser ? 'none' : `1px solid ${colors.border.default}`,
          color: isUser ? colors.white : colors.text.primary,
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {typing ? (
          <>
            {typedContent}
            {typedContent.length < content.length && (
              <span
                style={{
                  opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                  color: colors.copper.default,
                }}
              >
                |
              </span>
            )}
          </>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

const ToolBadge = ({ name, delay }: { name: string; delay: number }) => {
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
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.copper.default}`,
        marginRight: 12,
        marginBottom: 8,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          backgroundColor: colors.status.success,
          borderRadius: '50%',
        }}
      />
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.sm,
          color: colors.copper.default,
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const OmegaScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const chatProgress = spring({
    frame: frame - fps * 0.5,
    fps,
    config: springConfigs.default,
  });

  const toolsProgress = spring({
    frame: frame - fps * 3,
    fps,
    config: springConfigs.snappy,
  });

  const selectedTools = ['firecrawl-aisdk', 'page-brief', 'sentiment-analysis'];

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
          top: 60,
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
            marginBottom: 8,
          }}
        >
          MEET OMEGA
        </div>
        <div
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          AI that picks the right tools for you
        </div>
      </div>

      {/* Chat interface */}
      <div
        style={{
          width: 700,
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.border.default}`,
          overflow: 'hidden',
          opacity: chatProgress,
          transform: `scale(${interpolate(chatProgress, [0, 1], [0.95, 1])})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: colors.copper.default,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Omega Agent
          </span>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: colors.status.success,
              }}
            />
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              185 tools available
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: 24, minHeight: 300 }}>
          <ChatMessage
            content="Analyze the sentiment of recent tech news about AI regulations"
            delay={fps * 1}
          />

          {/* Tool selection indicator */}
          {frame > fps * 2.5 && (
            <div
              style={{
                marginBottom: 16,
                opacity: toolsProgress,
              }}
            >
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                  marginBottom: 12,
                }}
              >
                Selecting tools...
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {selectedTools.map((tool, i) => (
                  <ToolBadge key={tool} name={tool} delay={fps * 3 + i * 8} />
                ))}
              </div>
            </div>
          )}

          <ChatMessage
            content="I'll search for recent AI regulation news and analyze the sentiment. Found 12 articles - overall sentiment is cautiously optimistic with 67% positive coverage..."
            delay={fps * 4.5}
            typing
          />
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(frame, [fps * 6, fps * 7], [0, 1], {
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
          No manual tool selection. <span style={{ color: colors.copper.default }}>Just ask.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

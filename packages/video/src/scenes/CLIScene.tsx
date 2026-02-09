import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 6: Using the CLI (2:10 - 2:40)
 * Terminal commands with real output
 */
export const CLIScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal window animation
  const windowProgress = spring({
    frame,
    fps,
    config: springConfigs.default,
  });

  // Command timings
  const cmd1Start = fps * 0.5;
  const cmd2Start = fps * 2;
  const cmd3Start = fps * 4.5;

  // Typing animation helper
  const typeText = (text: string, start: number, speed = 2) => {
    const adjustedFrame = Math.max(0, frame - start);
    const chars = Math.min(text.length, Math.floor(adjustedFrame / speed));
    return text.slice(0, chars);
  };

  // Search results
  const results = [
    { name: 'firecrawl-aisdk', stars: '★★★★★', desc: 'Web crawling & scraping' },
    { name: 'page-brief', stars: '★★★★☆', desc: 'Summarize any webpage' },
    { name: 'search', stars: '★★★★☆', desc: 'Web search integration' },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fontFamily.sans,
        padding: 80,
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          width: 1000,
          backgroundColor: colors.bg.surface,
          border: `1px solid ${colors.border.default}`,
          overflow: 'hidden',
          opacity: windowProgress,
          transform: `scale(${interpolate(windowProgress, [0, 1], [0.95, 1])})`,
          boxShadow: `0 40px 80px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: colors.bg.surface2,
            borderBottom: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
          <span
            style={{
              marginLeft: 12,
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            tpmjs-cli
          </span>
        </div>

        {/* Terminal content */}
        <div
          style={{
            padding: 28,
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.base,
            lineHeight: typography.lineHeight.loose,
            minHeight: 400,
          }}
        >
          {/* Command 1: Install */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ color: colors.copper.default }}>$</span>{' '}
            <span style={{ color: colors.text.primary }}>
              {typeText('npm install -g @tpmjs/cli', cmd1Start)}
            </span>
          </div>

          {/* Command 2: Search */}
          {frame > cmd2Start && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: colors.copper.default }}>$</span>{' '}
              <span style={{ color: colors.text.primary }}>
                {typeText('tpm tool search "web scraping"', cmd2Start)}
              </span>
            </div>
          )}

          {/* Search results */}
          {frame > cmd2Start + fps * 1 && (
            <div style={{ marginBottom: 24, marginLeft: 20 }}>
              <div
                style={{
                  color: colors.text.muted,
                  marginBottom: 12,
                  opacity: interpolate(frame - cmd2Start - fps, [0, fps * 0.3], [0, 1], {
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                Found 12 tools:
              </div>
              {results.map((result, i) => {
                const resultProgress = spring({
                  frame: frame - cmd2Start - fps * 1.2 - i * 8,
                  fps,
                  config: springConfigs.snappy,
                });
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginBottom: 8,
                      opacity: resultProgress,
                      transform: `translateX(${interpolate(resultProgress, [0, 1], [-20, 0])}px)`,
                    }}
                  >
                    <span style={{ color: colors.text.muted, width: 24 }}>{i + 1}.</span>
                    <span style={{ color: colors.copper.default, width: 180 }}>{result.name}</span>
                    <span style={{ color: colors.status.warning, width: 80 }}>{result.stars}</span>
                    <span style={{ color: colors.text.secondary }}>{result.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Command 3: Execute */}
          {frame > cmd3Start && (
            <>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: colors.copper.default }}>$</span>{' '}
                <span style={{ color: colors.text.primary }}>
                  {typeText('tpm tool execute firecrawl-aisdk', cmd3Start)}
                </span>
              </div>

              {frame > cmd3Start + fps * 1.5 && (
                <div style={{ marginLeft: 20 }}>
                  <div
                    style={{
                      color: colors.status.success,
                      opacity: spring({
                        frame: frame - cmd3Start - fps * 1.5,
                        fps,
                        config: springConfigs.snappy,
                      }),
                    }}
                  >
                    ✓ Executing with default parameters...
                  </div>
                  {frame > cmd3Start + fps * 2.5 && (
                    <div
                      style={{
                        color: colors.status.success,
                        opacity: spring({
                          frame: frame - cmd3Start - fps * 2.5,
                          fps,
                          config: springConfigs.snappy,
                        }),
                      }}
                    >
                      ✓ Result returned in 2.3s
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

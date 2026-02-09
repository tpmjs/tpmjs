import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../design-tokens';

/**
 * Scene 5: Publishing a Tool (1:30 - 2:10)
 * Code editor aesthetic with typing animation
 */

const TypewriterCode = ({
  code,
  delay,
  speed = 2,
}: {
  code: string;
  delay: number;
  speed?: number;
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const chars = Math.min(code.length, Math.floor(adjustedFrame / speed));

  return (
    <span>
      {code.slice(0, chars)}
      {chars < code.length && chars > 0 && (
        <span
          style={{
            opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
            color: colors.copper.default,
          }}
        >
          |
        </span>
      )}
    </span>
  );
};

export const PublishingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  // Step 1 timing
  const step1Start = fps * 1;
  const step1HeaderProgress = spring({
    frame: frame - step1Start,
    fps,
    config: springConfigs.snappy,
  });

  // Step 2 timing
  const step2Start = fps * 5;
  const step2Progress = spring({
    frame: frame - step2Start,
    fps,
    config: springConfigs.snappy,
  });

  // Success message
  const successStart = fps * 7;
  const successProgress = spring({
    frame: frame - successStart,
    fps,
    config: springConfigs.bouncy,
  });

  // Final message
  const finalStart = fps * 9;
  const finalProgress = interpolate(frame, [finalStart, finalStart + fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const packageJson = `{
  "name": "my-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment"
  }
}`;

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
        <span
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Publishing a tool takes <span style={{ color: colors.copper.default }}>60 seconds</span>.
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 60,
          width: '100%',
          maxWidth: 1400,
        }}
      >
        {/* Step 1: package.json */}
        <div
          style={{
            flex: 1,
            opacity: step1HeaderProgress,
            transform: `translateY(${interpolate(step1HeaderProgress, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.copper.default,
              marginBottom: 16,
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            STEP 1: Add to package.json
          </div>

          {/* Code block */}
          <div
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              padding: 24,
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              whiteSpace: 'pre',
            }}
          >
            <TypewriterCode code={packageJson} delay={step1Start + fps * 0.5} speed={1} />
          </div>
        </div>

        {/* Step 2: Publish */}
        <div
          style={{
            flex: 1,
            opacity: step2Progress,
            transform: `translateY(${interpolate(step2Progress, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.copper.default,
              marginBottom: 16,
              letterSpacing: typography.letterSpacing.wide,
            }}
          >
            STEP 2: Publish
          </div>

          {/* Terminal */}
          <div
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              overflow: 'hidden',
            }}
          >
            {/* Terminal header */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: colors.bg.surface2,
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: 8,
              }}
            >
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

            {/* Terminal content */}
            <div
              style={{
                padding: 24,
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.loose,
              }}
            >
              <div style={{ color: colors.text.secondary }}>
                <span style={{ color: colors.copper.default }}>$</span>{' '}
                <TypewriterCode code="npm publish" delay={step2Start + fps * 0.3} />
              </div>

              {/* Success output */}
              {frame > successStart && (
                <div
                  style={{
                    marginTop: 20,
                    opacity: successProgress,
                    transform: `scale(${interpolate(successProgress, [0, 1], [0.9, 1])})`,
                  }}
                >
                  <span style={{ color: colors.status.success }}>✓</span>{' '}
                  <span style={{ color: colors.text.primary }}>
                    Tool live on tpmjs.com in 15 minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final message */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: finalProgress,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize['2xl'],
            color: colors.text.secondary,
          }}
        >
          That's it. No proprietary registry.{' '}
          <span
            style={{ color: colors.copper.default, fontWeight: typography.fontWeight.semibold }}
          >
            Just npm.
          </span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

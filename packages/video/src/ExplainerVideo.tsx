import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { colors } from './design-tokens';
import { CategoriesScene } from './scenes/CategoriesScene';
import { CLIScene } from './scenes/CLIScene';
import { ClosingScene } from './scenes/ClosingScene';
import { CollectionsScene } from './scenes/CollectionsScene';
import { GetStartedScene } from './scenes/GetStartedScene';
import { IntroScene } from './scenes/IntroScene';
import { MCPScene } from './scenes/MCPScene';
import { OmegaScene } from './scenes/OmegaScene';
// Scene imports
import { OpeningScene } from './scenes/OpeningScene';
import { PillarsScene } from './scenes/PillarsScene';
import { ProblemScene } from './scenes/ProblemScene';
import { PublishingScene } from './scenes/PublishingScene';
import { SecurityScene } from './scenes/SecurityScene';
import { WebPlatformScene } from './scenes/WebPlatformScene';

/**
 * TPMJS 5-Minute Explainer Video
 * Total: 9000 frames @ 30fps = 5 minutes
 */
export const ExplainerVideo = () => {
  const { fps } = useVideoConfig();

  // Scene timing (in seconds)
  const scenes = [
    { component: OpeningScene, start: 0, duration: 10 },
    { component: ProblemScene, start: 10, duration: 20 },
    { component: IntroScene, start: 30, duration: 20 },
    { component: PillarsScene, start: 50, duration: 40 },
    { component: PublishingScene, start: 90, duration: 40 },
    { component: CLIScene, start: 130, duration: 30 },
    { component: WebPlatformScene, start: 160, duration: 20 },
    { component: CollectionsScene, start: 180, duration: 20 },
    { component: MCPScene, start: 200, duration: 20 },
    { component: OmegaScene, start: 220, duration: 20 },
    { component: CategoriesScene, start: 240, duration: 15 },
    { component: SecurityScene, start: 255, duration: 15 },
    { component: GetStartedScene, start: 270, duration: 15 },
    { component: ClosingScene, start: 285, duration: 15 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg.base }}>
      {scenes.map(({ component: Component, start, duration }, index) => (
        <Sequence
          key={index}
          from={start * fps}
          durationInFrames={duration * fps}
          premountFor={fps}
        >
          <Component />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

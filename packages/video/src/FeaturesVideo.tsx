import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { colors } from './design-tokens';
import { CollectionsFeatureScene } from './scenes/features/CollectionsFeatureScene';
import { CustomAgentsScene } from './scenes/features/CustomAgentsScene';
import { DeveloperSDKScene } from './scenes/features/DeveloperSDKScene';
import { FeaturesClosingScene } from './scenes/features/FeaturesClosingScene';
// Scene imports
import { FeaturesOpeningScene } from './scenes/features/FeaturesOpeningScene';
import { LivingSkillsScene } from './scenes/features/LivingSkillsScene';
import { MCPProtocolScene } from './scenes/features/MCPProtocolScene';
import { OmegaAgentScene } from './scenes/features/OmegaAgentScene';
import { SecureExecutionScene } from './scenes/features/SecureExecutionScene';
import { TestScenariosScene } from './scenes/features/TestScenariosScene';
import { ToolRegistryScene } from './scenes/features/ToolRegistryScene';

/**
 * TPMJS Features Showcase Video
 * Total: 2700 frames @ 30fps = 90 seconds
 *
 * A punchy showcase of all 9 platform features
 */
export const FeaturesVideo = () => {
  const { fps } = useVideoConfig();

  // Scene timing (in seconds)
  const scenes = [
    { component: FeaturesOpeningScene, start: 0, duration: 6 },
    { component: ToolRegistryScene, start: 6, duration: 9 },
    { component: OmegaAgentScene, start: 15, duration: 9 },
    { component: CollectionsFeatureScene, start: 24, duration: 8 },
    { component: CustomAgentsScene, start: 32, duration: 8 },
    { component: MCPProtocolScene, start: 40, duration: 9 },
    { component: SecureExecutionScene, start: 49, duration: 8 },
    { component: TestScenariosScene, start: 57, duration: 8 },
    { component: LivingSkillsScene, start: 65, duration: 8 },
    { component: DeveloperSDKScene, start: 73, duration: 9 },
    { component: FeaturesClosingScene, start: 82, duration: 8 },
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

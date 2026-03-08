import { spacing } from '../tokens';

export const alertTokens = {
  padding: {
    x: spacing[4], // 16px
    y: spacing[3], // 12px
  },
  iconSize: '16px',
  gap: spacing[3], // 12px
  titleMarginBottom: spacing[1], // 4px
  borderWidth: '2px',
} as const;

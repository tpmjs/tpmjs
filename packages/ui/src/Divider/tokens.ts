import { spacing } from '../tokens';

export const dividerTokens = {
  spacing: {
    none: '0',
    sm: spacing[2], // 8px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
  },
  thickness: {
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
} as const;

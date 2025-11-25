import { fontSize, spacing } from "../tokens";

/**
 * Tabs component design tokens
 * Maps global tokens to tabs-specific semantics
 */
export const tabsTokens = {
	/** Padding for each size */
	padding: {
		sm: {
			x: spacing[3], // 0.75rem (12px)
			y: spacing[2], // 0.5rem (8px)
		},
		md: {
			x: spacing[4], // 1rem (16px)
			y: spacing[3], // 0.75rem (12px)
		},
		lg: {
			x: spacing[6], // 1.5rem (24px)
			y: spacing[4], // 1rem (16px)
		},
	},

	/** Font size for each size */
	fontSize: {
		sm: fontSize.sm, // 0.875rem (14px)
		md: fontSize.base, // 1rem (16px)
		lg: fontSize.lg, // 1.125rem (18px)
	},

	/** Gap between tabs */
	gap: spacing[1], // 0.25rem (4px)
} as const;

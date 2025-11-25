import { borderRadius, spacing } from "../tokens";

/**
 * Badge component design tokens
 * Maps global tokens to badge-specific semantics
 */
export const badgeTokens = {
	/** Horizontal padding for each size */
	padding: {
		x: {
			sm: spacing[2], // 0.5rem (8px)
			md: spacing[2.5], // 0.625rem (10px)
			lg: spacing[3], // 0.75rem (12px)
		},
		y: {
			sm: spacing[0.5], // 0.125rem (2px)
			md: spacing[1], // 0.25rem (4px)
			lg: spacing[1.5], // 0.375rem (6px)
		},
	},

	/** Font sizes for each size */
	fontSize: {
		sm: "0.75rem", // 12px
		md: "0.875rem", // 14px
		lg: "1rem", // 16px
	},

	/** Line heights for each size */
	lineHeight: {
		sm: "1rem", // 16px
		md: "1.25rem", // 20px
		lg: "1.5rem", // 24px
	},

	/** Border radius */
	borderRadius: borderRadius.full,

	/** Border width */
	borderWidth: "1px",
} as const;

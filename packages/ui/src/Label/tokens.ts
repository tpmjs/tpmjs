import { spacing } from "../tokens";

/**
 * Label component design tokens
 * Maps global tokens to label-specific semantics
 */
export const labelTokens = {
	/** Font sizes for each size */
	fontSize: {
		sm: "0.875rem", // 14px
		md: "1rem", // 16px
		lg: "1.125rem", // 18px
	},

	/** Line heights for each size */
	lineHeight: {
		sm: "1.25rem", // 20px
		md: "1.5rem", // 24px
		lg: "1.75rem", // 28px
	},

	/** Margin bottom (spacing from label to input) */
	marginBottom: spacing[2], // 0.5rem (8px)

	/** Required indicator spacing */
	requiredSpacing: spacing[1], // 0.25rem (4px)
} as const;

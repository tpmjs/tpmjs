/**
 * Shadow token system for TPMJS UI
 * Subtle shadows for dark mode with minimal elevation
 */

/**
 * Box shadow definitions
 * Subtle and understated for technical aesthetic
 */
export const boxShadow = {
	none: "none",
	sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
	base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
	md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
	lg: "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
	xl: "0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
	"2xl": "0 25px 50px -12px rgb(0 0 0 / 0.3)",
	inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
} as const;

/**
 * Drop shadow definitions (for SVG and images)
 */
export const dropShadow = {
	none: "none",
	sm: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))",
	base: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))",
	md: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
	lg: "drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))",
	xl: "drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))",
	"2xl": "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))",
} as const;

/**
 * Elevation system
 * Semantic elevation levels for layered interfaces
 */
export const elevation = {
	0: boxShadow.none,
	1: boxShadow.sm,
	2: boxShadow.base,
	3: boxShadow.md,
	4: boxShadow.lg,
	5: boxShadow.xl,
	6: boxShadow["2xl"],
} as const;

/**
 * Complete shadows export
 */
export const shadows = {
	box: boxShadow,
	drop: dropShadow,
	elevation,
} as const;

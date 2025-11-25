/**
 * Color token system for TPMJS UI
 * Dark mode first approach with Vercel/Cursor/Perplexity aesthetic
 *
 * Colors use HSL format for easy dark mode implementation
 */

/**
 * Neutral grayscale palette (16 stops for granular control)
 * Optimized for dark mode with subtle, desaturated tones
 */
export const neutral = {
	0: "#000000",
	50: "#0a0a0a",
	100: "#171717",
	200: "#262626",
	300: "#404040",
	400: "#525252",
	500: "#737373",
	600: "#a3a3a3",
	700: "#d4d4d4",
	800: "#e5e5e5",
	900: "#f5f5f5",
	950: "#fafafa",
	1000: "#ffffff",
} as const;

/**
 * Semantic color tokens
 * Reference CSS variables for theme-aware colors
 */
export const semantic = {
	background: {
		DEFAULT: "hsl(var(--background))",
		surface: "hsl(var(--surface))",
		elevated: "hsl(var(--surface-elevated))",
		overlay: "hsl(var(--surface-overlay))",
	},
	foreground: {
		DEFAULT: "hsl(var(--foreground))",
		secondary: "hsl(var(--foreground-secondary))",
		tertiary: "hsl(var(--foreground-tertiary))",
		muted: "hsl(var(--foreground-muted))",
	},
	border: {
		DEFAULT: "hsl(var(--border))",
		strong: "hsl(var(--border-strong))",
		subtle: "hsl(var(--border-subtle))",
	},
	primary: {
		DEFAULT: "hsl(var(--primary))",
		foreground: "hsl(var(--primary-foreground))",
	},
	secondary: {
		DEFAULT: "hsl(var(--secondary))",
		foreground: "hsl(var(--secondary-foreground))",
	},
	accent: {
		DEFAULT: "hsl(var(--accent))",
		foreground: "hsl(var(--accent-foreground))",
	},
	muted: {
		DEFAULT: "hsl(var(--muted))",
		foreground: "hsl(var(--muted-foreground))",
	},
} as const;

/**
 * Status colors (subtle, desaturated for dark mode)
 */
export const status = {
	success: {
		DEFAULT: "hsl(var(--success))",
		foreground: "hsl(var(--success-foreground))",
	},
	error: {
		DEFAULT: "hsl(var(--error))",
		foreground: "hsl(var(--error-foreground))",
	},
	warning: {
		DEFAULT: "hsl(var(--warning))",
		foreground: "hsl(var(--warning-foreground))",
	},
	info: {
		DEFAULT: "hsl(var(--info))",
		foreground: "hsl(var(--info-foreground))",
	},
} as const;

/**
 * Micro-accent colors for dark mode highlights
 * Used sparingly for visual interest
 */
export const accents = {
	blue: "#60a5fa",
	purple: "#a78bfa",
	green: "#34d399",
	pink: "#f472b6",
	orange: "#fb923c",
	yellow: "#fbbf24",
} as const;

/**
 * Form element colors
 */
export const form = {
	input: "hsl(var(--input))",
	ring: "hsl(var(--ring))",
	ringOffset: "hsl(var(--ring-offset))",
} as const;

/**
 * Grid/blueprint pattern colors
 */
export const grid = {
	color: "hsl(var(--grid-color))",
	size: "var(--grid-size)",
} as const;

/**
 * Card colors
 */
export const card = {
	DEFAULT: "hsl(var(--card))",
	foreground: "hsl(var(--card-foreground))",
} as const;

/**
 * Legacy destructive color (for backward compatibility)
 */
export const destructive = {
	DEFAULT: "hsl(var(--destructive))",
	foreground: "hsl(var(--destructive-foreground))",
} as const;

/**
 * Complete color export
 */
export const colors = {
	neutral,
	semantic,
	status,
	accents,
	form,
	grid,
	card,
	destructive,
	// Flat exports for easy access
	background: semantic.background.DEFAULT,
	foreground: semantic.foreground.DEFAULT,
	border: semantic.border.DEFAULT,
	primary: semantic.primary.DEFAULT,
	secondary: semantic.secondary.DEFAULT,
	accent: semantic.accent.DEFAULT,
	muted: semantic.muted.DEFAULT,
	success: status.success.DEFAULT,
	error: status.error.DEFAULT,
	warning: status.warning.DEFAULT,
	info: status.info.DEFAULT,
} as const;

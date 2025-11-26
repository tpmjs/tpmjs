import { createVariants } from "../system/variants";

/**
 * Card variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const cardVariants = createVariants({
	base: [
		// Layout
		"relative",
		// Borders & Radius
		"rounded-lg",
		// Transitions
		"transition-base",
	].join(" "),

	variants: {
		variant: {
			default: [
				"border border-dotted border-border",
				"bg-card text-card-foreground",
				"shadow-sm",
			].join(" "),

			elevated: [
				"border border-dotted border-border",
				"bg-surface-elevated text-card-foreground",
				"shadow-md",
			].join(" "),

			outline: [
				"border-2 border-dotted border-border",
				"bg-transparent text-foreground",
			].join(" "),

			blueprint: [
				"border border-dotted border-border",
				"bg-card text-card-foreground",
				"shadow-blueprint",
				"hover:shadow-blueprint-hover",
			].join(" "),

			ghost: ["bg-transparent text-foreground"].join(" "),
		},

		padding: {
			none: "p-0",
			sm: "p-4",
			md: "p-6",
			lg: "p-8",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		variant: "default",
		padding: "none", // Card itself has no padding, sections do
	},
});

/**
 * CardHeader variant definitions
 */
export const cardHeaderVariants = createVariants({
	base: ["flex flex-col"].join(" "),

	variants: {
		padding: {
			none: "p-0",
			sm: "p-4",
			md: "p-6",
			lg: "p-8",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		padding: "md",
	},
});

/**
 * CardTitle variant definitions
 */
export const cardTitleVariants = createVariants({
	base: [
		"text-2xl font-semibold leading-none tracking-tight",
		"text-foreground",
	].join(" "),

	variants: {},

	compoundVariants: [],

	defaultVariants: {},
});

/**
 * CardDescription variant definitions
 */
export const cardDescriptionVariants = createVariants({
	base: ["text-sm text-foreground-secondary", "mt-1.5"].join(" "),

	variants: {},

	compoundVariants: [],

	defaultVariants: {},
});

/**
 * CardContent variant definitions
 */
export const cardContentVariants = createVariants({
	base: [
		// Base content styles
	].join(" "),

	variants: {
		padding: {
			none: "p-0",
			sm: "p-4 pt-0",
			md: "p-6 pt-0",
			lg: "p-8 pt-0",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		padding: "md",
	},
});

/**
 * CardFooter variant definitions
 */
export const cardFooterVariants = createVariants({
	base: ["flex items-center"].join(" "),

	variants: {
		padding: {
			none: "p-0",
			sm: "p-4 pt-0",
			md: "p-6 pt-0",
			lg: "p-8 pt-0",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		padding: "md",
	},
});

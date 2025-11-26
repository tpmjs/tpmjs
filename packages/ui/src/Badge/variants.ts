import { createVariants } from "../system/variants";

/**
 * Badge variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const badgeVariants = createVariants({
	base: [
		// Layout
		"inline-flex items-center",
		// Typography
		"font-semibold",
		"whitespace-nowrap",
		// Borders & Radius
		"rounded-full",
		// Transitions
		"transition-base",
	].join(" "),

	variants: {
		variant: {
			default: ["bg-primary text-primary-foreground", "border border-primary"].join(" "),

			secondary: ["bg-secondary text-secondary-foreground", "border border-secondary"].join(" "),

			outline: ["bg-transparent text-foreground", "border border-border"].join(" "),

			success: ["bg-success text-success-foreground", "border border-success"].join(" "),

			error: ["bg-error text-error-foreground", "border border-error"].join(" "),

			warning: ["bg-warning text-warning-foreground", "border border-warning"].join(" "),

			info: ["bg-info text-info-foreground", "border border-info"].join(" "),
		},

		size: {
			sm: "px-2 py-0.5 text-xs",
			md: "px-2.5 py-1 text-sm",
			lg: "px-3 py-1.5 text-base",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		variant: "default",
		size: "md",
	},
});

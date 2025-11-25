import { createVariants } from "../system/variants";

/**
 * ProgressBar track variant definitions
 */
export const progressBarTrackVariants = createVariants({
	base: [
		// Layout
		"relative overflow-hidden",
		// Background
		"bg-surface",
		// Border
		"rounded",
	].join(" "),

	variants: {
		size: {
			sm: "h-1", // 4px
			md: "h-2", // 8px
			lg: "h-3", // 12px
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
	},
});

/**
 * ProgressBar fill variant definitions
 */
export const progressBarFillVariants = createVariants({
	base: [
		// Layout
		"h-full",
		// Transition
		"transition-all duration-300 ease-out",
		// Border
		"rounded",
	].join(" "),

	variants: {
		variant: {
			primary: "bg-primary",
			success: "bg-success",
			warning: "bg-warning",
			danger: "bg-error",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		variant: "primary",
	},
});

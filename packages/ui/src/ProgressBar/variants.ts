import { createVariants } from "../system/variants";

/**
 * ProgressBar track variant definitions
 */
export const progressBarTrackVariants = createVariants({
	base: [
		// Layout
		"relative overflow-hidden",
		// Background
		"bg-zinc-800",
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
			primary: "bg-blue-500",
			success: "bg-green-500",
			warning: "bg-yellow-500",
			danger: "bg-red-500",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		variant: "primary",
	},
});

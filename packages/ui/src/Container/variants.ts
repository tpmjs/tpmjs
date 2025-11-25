import { createVariants } from "../system/variants";

/**
 * Container variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const containerVariants = createVariants({
	base: [
		// Layout
		"mx-auto w-full",
	].join(" "),

	variants: {
		size: {
			sm: "max-w-screen-sm",
			md: "max-w-screen-md",
			lg: "max-w-screen-lg",
			xl: "max-w-screen-xl",
			"2xl": "max-w-screen-2xl",
			full: "max-w-full",
		},

		padding: {
			none: "px-0",
			sm: "px-4",
			md: "px-6",
			lg: "px-8",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "xl",
		padding: "md",
	},
});

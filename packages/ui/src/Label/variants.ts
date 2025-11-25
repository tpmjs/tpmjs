import { createVariants } from "../system/variants";

/**
 * Label variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const labelVariants = createVariants({
	base: [
		// Typography
		"font-medium text-foreground",
		"leading-none",
		// Cursor
		"cursor-pointer",
		// Peer styling support
		"peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
	].join(" "),

	variants: {
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg",
		},

		disabled: {
			true: "cursor-not-allowed opacity-50",
			false: "",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
		disabled: "false",
	},
});

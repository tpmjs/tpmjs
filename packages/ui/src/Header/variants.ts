import { createVariants } from "../system/variants";

/**
 * Header variant definitions
 */
export const headerVariants = createVariants({
	base: [
		// Display
		"flex items-center justify-between",
		// Width
		"w-full",
		// Background
		"bg-surface",
		// Border
		"border-b border-border",
	].join(" "),

	variants: {
		size: {
			sm: "h-12 px-4", // 48px height, 16px padding
			md: "h-16 px-6", // 64px height, 24px padding
			lg: "h-20 px-8", // 80px height, 32px padding
		},
		sticky: {
			true: "sticky top-0 z-50",
			false: "",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
		sticky: "false",
	},
});

/**
 * Header title variant definitions
 */
export const headerTitleVariants = createVariants({
	base: [
		// Display
		"flex items-center",
		// Font
		"font-semibold",
		// Color
		"text-foreground",
	].join(" "),

	variants: {
		size: {
			sm: "text-base gap-2", // 16px
			md: "text-lg gap-3", // 18px
			lg: "text-xl gap-4", // 20px
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
	},
});

/**
 * Header actions variant definitions
 */
export const headerActionsVariants = createVariants({
	base: [
		// Display
		"flex items-center",
	].join(" "),

	variants: {
		size: {
			sm: "gap-2", // 8px
			md: "gap-3", // 12px
			lg: "gap-4", // 16px
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
	},
});

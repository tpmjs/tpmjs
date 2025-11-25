import { createVariants } from "../system/variants";

/**
 * Tabs container variant definitions
 */
export const tabsContainerVariants = createVariants({
	base: [
		// Layout
		"flex items-center",
		// Overflow
		"overflow-x-auto",
		// Border
		"border-b border-zinc-800",
	].join(" "),

	variants: {
		size: {
			sm: "gap-1",
			md: "gap-1",
			lg: "gap-1",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
	},
});

/**
 * Tab button variant definitions
 */
export const tabButtonVariants = createVariants({
	base: [
		// Display
		"inline-flex items-center gap-2",
		// Font
		"font-medium whitespace-nowrap",
		// Border
		"border-b-2",
		// Transition
		"transition-colors duration-200",
		// Cursor
		"cursor-pointer",
	].join(" "),

	variants: {
		size: {
			sm: "text-sm px-3 py-2",
			md: "text-base px-4 py-3",
			lg: "text-lg px-6 py-4",
		},
		active: {
			true: "text-zinc-100 border-blue-500",
			false:
				"text-zinc-400 border-transparent hover:text-zinc-300 hover:border-zinc-700",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
		active: "false",
	},
});

/**
 * Tab count badge variant definitions
 */
export const tabCountVariants = createVariants({
	base: [
		// Display
		"inline-flex items-center justify-center",
		// Size
		"min-w-[1.25rem] h-5",
		// Padding
		"px-1.5",
		// Font
		"text-xs font-medium tabular-nums",
		// Background
		"bg-zinc-800",
		// Border
		"rounded-full",
	].join(" "),

	variants: {
		active: {
			true: "text-zinc-100",
			false: "text-zinc-500",
		},
	},

	compoundVariants: [],

	defaultVariants: {
		active: "false",
	},
});

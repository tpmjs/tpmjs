import { createVariants } from "../system/variants";

/**
 * CodeBlock container variant definitions
 */
export const codeBlockContainerVariants = createVariants({
	base: [
		// Layout
		"relative",
		// Background
		"bg-zinc-900",
		// Border
		"border border-zinc-800 rounded-lg",
		// Overflow
		"overflow-hidden",
	].join(" "),

	variants: {},

	compoundVariants: [],

	defaultVariants: {},
});

/**
 * CodeBlock code element variant definitions
 */
export const codeBlockCodeVariants = createVariants({
	base: [
		// Display
		"block",
		// Font
		"font-mono",
		// Color
		"text-zinc-300",
		// Overflow
		"overflow-x-auto",
		// Whitespace
		"whitespace-pre",
	].join(" "),

	variants: {
		size: {
			sm: "text-xs p-3", // 12px font, 12px padding
			md: "text-sm p-4", // 14px font, 16px padding
			lg: "text-base p-6", // 16px font, 24px padding
		},
	},

	compoundVariants: [],

	defaultVariants: {
		size: "md",
	},
});

/**
 * CodeBlock copy button variant definitions
 */
export const codeBlockCopyButtonVariants = createVariants({
	base: [
		// Position
		"absolute top-2 right-2",
		// Display
		"flex items-center justify-center",
		// Size
		"w-8 h-8",
		// Background
		"bg-zinc-800 hover:bg-zinc-700",
		// Border
		"border border-zinc-700 rounded",
		// Color
		"text-zinc-400 hover:text-zinc-100",
		// Cursor
		"cursor-pointer",
		// Transition
		"transition-colors duration-200",
	].join(" "),

	variants: {},

	compoundVariants: [],

	defaultVariants: {},
});

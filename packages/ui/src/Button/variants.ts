import { createVariants } from "../system/variants";

/**
 * Button variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const buttonVariants = createVariants({
	base: [
		// Layout
		"inline-flex items-center justify-center gap-2",
		// Typography
		"font-medium text-sm",
		"whitespace-nowrap",
		// Borders & Radius
		"rounded-md",
		// Transitions
		"transition-base",
		// Focus
		"focus-ring",
		// Disabled state
		"disabled:pointer-events-none disabled:opacity-50",
	].join(" "),

	variants: {
		variant: {
			default: [
				"bg-primary text-primary-foreground",
				"hover:bg-primary/90",
				"active:bg-primary/80",
			].join(" "),

			destructive: [
				"bg-error text-error-foreground",
				"hover:bg-error/90",
				"active:bg-error/80",
			].join(" "),

			outline: [
				"border border-border bg-transparent",
				"hover:bg-accent hover:text-accent-foreground hover:border-border-strong",
				"active:bg-accent/80",
			].join(" "),

			"outline-dotted": [
				"border border-dotted border-border bg-transparent",
				"hover:bg-accent hover:text-accent-foreground hover:border-border-strong",
				"active:bg-accent/80",
			].join(" "),

			blueprint: [
				"border border-dotted border-border bg-card",
				"hover:shadow-blueprint-hover",
				"active:bg-card/90",
			].join(" "),

			secondary: [
				"bg-secondary text-secondary-foreground",
				"hover:bg-secondary/80",
				"active:bg-secondary/70",
			].join(" "),

			ghost: [
				"text-foreground",
				"hover:bg-accent hover:text-accent-foreground",
				"active:bg-accent/80",
			].join(" "),

			link: [
				"text-primary underline-offset-4",
				"hover:underline",
				"active:text-primary/80",
			].join(" "),
		},

		size: {
			sm: "h-9 px-3 text-sm",
			md: "h-10 px-4 text-base",
			lg: "h-11 px-8 text-lg",
			icon: "h-10 w-10 p-0",
		},

		loading: {
			true: "cursor-wait",
			false: "",
		},
	},

	compoundVariants: [
		{
			conditions: { variant: "outline", size: "sm" },
			className: "border-1",
		},
		{
			conditions: { variant: "link", size: "sm" },
			className: "px-0",
		},
		{
			conditions: { variant: "link", size: "md" },
			className: "px-0",
		},
		{
			conditions: { variant: "link", size: "lg" },
			className: "px-0",
		},
	],

	defaultVariants: {
		variant: "default",
		size: "md",
		loading: "false",
	},
});

import type { HTMLAttributes } from "react";

/**
 * Section component props
 */
export interface SectionProps extends HTMLAttributes<HTMLElement> {
	/**
	 * Semantic section element to render
	 * @default 'section'
	 */
	as?: "section" | "article" | "aside" | "nav" | "div";

	/**
	 * Vertical spacing size
	 * @default 'md'
	 */
	spacing?: "none" | "sm" | "md" | "lg" | "xl";

	/**
	 * Background variant
	 * @default 'default'
	 */
	background?: "default" | "surface" | "dotted-grid" | "blueprint" | "grid";

	/**
	 * Maximum width container
	 * @default 'none'
	 */
	container?: "none" | "sm" | "md" | "lg" | "xl" | "full";

	/**
	 * Center content horizontally
	 * @default false
	 */
	centered?: boolean;
}

/**
 * Section ref type
 */
export type SectionRef = HTMLElement;

import type { HTMLAttributes } from "react";

/**
 * CodeBlock component props
 */
export interface CodeBlockProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/**
	 * Code content to display
	 */
	code: string;

	/**
	 * Programming language (for display/metadata only)
	 * @default 'text'
	 */
	language?: string;

	/**
	 * Size variant
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";

	/**
	 * Whether to show copy button
	 * @default true
	 */
	showCopy?: boolean;
}

/**
 * CodeBlock ref type
 */
export type CodeBlockRef = HTMLDivElement;

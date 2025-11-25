import type { LabelHTMLAttributes } from "react";

/**
 * Label component props
 */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
	/**
	 * Size of the label
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";

	/**
	 * Whether the associated field is required
	 * @default false
	 */
	required?: boolean;

	/**
	 * Whether the label should be visually disabled
	 * @default false
	 */
	disabled?: boolean;
}

/**
 * Label ref type
 */
export type LabelRef = HTMLLabelElement;

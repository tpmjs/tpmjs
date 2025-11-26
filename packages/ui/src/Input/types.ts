import type { InputHTMLAttributes } from "react";

/**
 * Input component props
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
	/**
	 * Visual state of the input
	 * @default 'default'
	 */
	state?: "default" | "error" | "success";

	/**
	 * Size of the input
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";

	/**
	 * Full width input
	 * @default false
	 */
	fullWidth?: boolean;
}

/**
 * Input ref type
 */
export type InputRef = HTMLInputElement;

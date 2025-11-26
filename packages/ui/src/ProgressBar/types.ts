import type { HTMLAttributes } from "react";

/**
 * ProgressBar component props
 */
export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/**
	 * Progress value (0-100)
	 */
	value: number;

	/**
	 * Size variant
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";

	/**
	 * Color variant
	 * @default 'primary'
	 */
	variant?: "primary" | "success" | "warning" | "danger";

	/**
	 * Whether to show percentage label
	 * @default false
	 */
	showLabel?: boolean;
}

/**
 * ProgressBar ref type
 */
export type ProgressBarRef = HTMLDivElement;

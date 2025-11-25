import type { HTMLAttributes } from "react";

/**
 * Container component props
 */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Maximum width of the container
	 * @default 'xl'
	 */
	size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

	/**
	 * Horizontal padding
	 * @default 'md'
	 */
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Container ref type
 */
export type ContainerRef = HTMLDivElement;

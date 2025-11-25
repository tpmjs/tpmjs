import type { HTMLAttributes } from "react";

/**
 * Card component props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Visual variant of the card
	 * @default 'default'
	 */
	variant?: "default" | "elevated" | "outline" | "blueprint" | "ghost";

	/**
	 * Padding size for the card
	 * @default 'md'
	 */
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * CardHeader component props
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Padding size for the header
	 * @default 'md'
	 */
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * CardTitle component props
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	/**
	 * Heading level
	 * @default 'h3'
	 */
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

/**
 * CardDescription component props
 */
export interface CardDescriptionProps
	extends HTMLAttributes<HTMLParagraphElement> {}

/**
 * CardContent component props
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Padding size for the content
	 * @default 'md'
	 */
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * CardFooter component props
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Padding size for the footer
	 * @default 'md'
	 */
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Card ref type
 */
export type CardRef = HTMLDivElement;

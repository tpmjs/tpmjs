import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type {
	CardContentProps,
	CardDescriptionProps,
	CardFooterProps,
	CardHeaderProps,
	CardProps,
	CardTitleProps,
} from "./types";
import {
	cardContentVariants,
	cardDescriptionVariants,
	cardFooterVariants,
	cardHeaderVariants,
	cardTitleVariants,
	cardVariants,
} from "./variants";

/**
 * Card component
 *
 * A flexible container component with multiple variants and sub-components.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@tpmjs/ui/Card/Card';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Card, { variant: 'elevated' },
 *     createElement(CardHeader, null,
 *       createElement(CardTitle, null, 'Card Title'),
 *       createElement(CardDescription, null, 'Card description text')
 *     ),
 *     createElement(CardContent, null, 'Card content goes here'),
 *     createElement(CardFooter, null, 'Footer content')
 *   );
 * }
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, variant = "default", padding = "none", ...props }, ref) => {
		return createElement("div", {
			ref,
			className: cn(
				cardVariants({
					variant,
					padding,
				}),
				className,
			),
			...props,
		});
	},
);

Card.displayName = "Card";

/**
 * CardHeader component
 *
 * Header section of a card, typically contains title and description.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, padding = "md", ...props }, ref) => {
		return createElement("div", {
			ref,
			className: cn(
				cardHeaderVariants({
					padding,
				}),
				className,
			),
			...props,
		});
	},
);

CardHeader.displayName = "CardHeader";

/**
 * CardTitle component
 *
 * Title heading for a card.
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
	({ className, as = "h3", ...props }, ref) => {
		return createElement(as, {
			ref,
			className: cn(cardTitleVariants(), className),
			...props,
		});
	},
);

CardTitle.displayName = "CardTitle";

/**
 * CardDescription component
 *
 * Description text for a card, typically placed below the title.
 */
export const CardDescription = forwardRef<
	HTMLParagraphElement,
	CardDescriptionProps
>(({ className, ...props }, ref) => {
	return createElement("p", {
		ref,
		className: cn(cardDescriptionVariants(), className),
		...props,
	});
});

CardDescription.displayName = "CardDescription";

/**
 * CardContent component
 *
 * Main content area of a card.
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
	({ className, padding = "md", ...props }, ref) => {
		return createElement("div", {
			ref,
			className: cn(
				cardContentVariants({
					padding,
				}),
				className,
			),
			...props,
		});
	},
);

CardContent.displayName = "CardContent";

/**
 * CardFooter component
 *
 * Footer section of a card, typically contains actions.
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
	({ className, padding = "md", ...props }, ref) => {
		return createElement("div", {
			ref,
			className: cn(
				cardFooterVariants({
					padding,
				}),
				className,
			),
			...props,
		});
	},
);

CardFooter.displayName = "CardFooter";

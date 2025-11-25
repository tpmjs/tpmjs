import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { HeaderProps } from "./types";
import {
	headerActionsVariants,
	headerTitleVariants,
	headerVariants,
} from "./variants";

/**
 * Header component
 *
 * A flexible header bar with title and action slots.
 * Supports sticky positioning and responsive sizing.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Header } from '@tpmjs/ui/Header/Header';
 * import { Button } from '@tpmjs/ui/Button/Button';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Header, {
 *     title: 'TPMJS Registry',
 *     actions: createElement(Button, { variant: 'ghost' }, 'Sign In'),
 *     size: 'md',
 *     sticky: true,
 *   });
 * }
 * ```
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(
	(
		{
			className,
			title,
			actions,
			size = "md",
			sticky = false,
			children,
			...props
		},
		ref,
	) => {
		return createElement(
			"header",
			{
				className: cn(
					headerVariants({
						size,
						sticky: sticky ? "true" : "false",
					}),
					className,
				),
				ref,
				...props,
			},
			[
				title &&
					createElement(
						"div",
						{
							key: "title",
							className: headerTitleVariants({
								size,
							}),
							"data-testid": "header-title",
						},
						title,
					),
				children &&
					createElement(
						"div",
						{
							key: "children",
							className: "flex-1 flex items-center justify-center",
							"data-testid": "header-children",
						},
						children,
					),
				actions &&
					createElement(
						"div",
						{
							key: "actions",
							className: headerActionsVariants({
								size,
							}),
							"data-testid": "header-actions",
						},
						actions,
					),
			].filter(Boolean),
		);
	},
);

Header.displayName = "Header";

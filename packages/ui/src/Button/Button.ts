import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { ButtonProps } from "./types";
import { buttonVariants } from "./variants";

/**
 * Button component
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Button } from '@tpmjs/ui/Button/Button';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Button, {
 *     variant: 'outline',
 *     size: 'lg',
 *     onClick: () => console.log('clicked'),
 *     children: 'Click me',
 *   });
 * }
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "md",
			loading = false,
			disabled = false,
			children,
			...props
		},
		ref,
	) => {
		return createElement(
			"button",
			{
				type: "button",
				className: cn(
					buttonVariants({
						variant,
						size,
						loading: loading ? "true" : "false",
					}),
					className,
				),
				ref,
				disabled: disabled || loading,
				"aria-disabled": disabled || loading ? "true" : undefined,
				"aria-busy": loading ? "true" : undefined,
				...props,
			},
			loading
				? createElement(
						"span",
						{ className: "flex items-center gap-2" },
						createElement("span", {
							className:
								"h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
							"aria-hidden": "true",
						}),
						createElement("span", null, children),
					)
				: children,
		);
	},
);

Button.displayName = "Button";

import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { LabelProps } from "./types";
import { labelVariants } from "./variants";

/**
 * Label component
 *
 * A label component for form inputs with proper accessibility.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Label } from '@tpmjs/ui/Label/Label';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Label, {
 *     htmlFor: 'email',
 *     children: 'Email Address',
 *   });
 * }
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
	(
		{
			className,
			size = "md",
			required = false,
			disabled = false,
			children,
			...props
		},
		ref,
	) => {
		return createElement(
			"label",
			{
				className: cn(
					labelVariants({
						size,
						disabled: disabled ? "true" : "false",
					}),
					className,
				),
				ref,
				...props,
			},
			children,
			required
				? createElement(
						"span",
						{
							className: "ml-1 text-error",
							"aria-hidden": "true",
						},
						"*",
					)
				: null,
		);
	},
);

Label.displayName = "Label";

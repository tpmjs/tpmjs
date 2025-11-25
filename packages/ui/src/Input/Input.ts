import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { InputProps } from "./types";
import { inputVariants } from "./variants";

/**
 * Input component
 *
 * A versatile input component with multiple states, sizes, and full HTML input support.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Input } from '@tpmjs/ui/Input/Input';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Input, {
 *     type: 'email',
 *     placeholder: 'Enter your email',
 *     state: 'default',
 *     size: 'md',
 *   });
 * }
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type = "text",
			state = "default",
			size = "md",
			fullWidth = true,
			disabled = false,
			...props
		},
		ref,
	) => {
		return createElement("input", {
			type,
			className: cn(
				inputVariants({
					state,
					size,
					fullWidth: fullWidth ? "true" : "false",
				}),
				className,
			),
			ref,
			disabled,
			"aria-invalid": state === "error" ? "true" : undefined,
			...props,
		});
	},
);

Input.displayName = "Input";

import { cn } from "@tpmjs/utils/cn";
import { forwardRef } from "react";
import type { LabelProps } from "./types";
import { labelVariants } from "./variants";

/**
 * Label component
 *
 * A label component for form inputs with proper accessibility.
 *
 * @example
 * ```tsx
 * import { Label } from '@tpmjs/ui/Label/Label';
 *
 * function MyComponent() {
 *   return <Label htmlFor="email">Email Address</Label>;
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
		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: This is a generic label component that can be used with htmlFor or wrap inputs
			<label
				ref={ref}
				className={cn(
					labelVariants({
						size,
						disabled: disabled ? "true" : "false",
					}),
					className,
				)}
				{...props}
			>
				{children}
				{required && (
					<span className="ml-1 text-error" aria-hidden="true">
						*
					</span>
				)}
			</label>
		);
	},
);

Label.displayName = "Label";

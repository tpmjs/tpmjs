import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { BadgeProps } from "./types";
import { badgeVariants } from "./variants";

/**
 * Badge component
 *
 * A versatile badge component for status indicators, tags, and labels.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Badge } from '@tpmjs/ui/Badge/Badge';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Badge, {
 *     variant: 'success',
 *     children: 'Active',
 *   });
 * }
 * ```
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
	({ className, variant = "default", size = "md", ...props }, ref) => {
		return createElement("div", {
			className: cn(
				badgeVariants({
					variant,
					size,
				}),
				className,
			),
			ref,
			...props,
		});
	},
);

Badge.displayName = "Badge";

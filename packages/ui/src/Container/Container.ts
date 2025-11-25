import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { ContainerProps } from "./types";
import { containerVariants } from "./variants";

/**
 * Container component
 *
 * A layout wrapper component with responsive max-width constraints.
 * Centers content and provides consistent horizontal padding.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Container } from '@tpmjs/ui/Container/Container';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Container, {
 *     size: 'xl',
 *     padding: 'md',
 *     children: 'Page content goes here',
 *   });
 * }
 * ```
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	({ className, size = "xl", padding = "md", children, ...props }, ref) => {
		return createElement(
			"div",
			{
				className: cn(
					containerVariants({
						size,
						padding,
					}),
					className,
				),
				ref,
				...props,
			},
			children,
		);
	},
);

Container.displayName = "Container";

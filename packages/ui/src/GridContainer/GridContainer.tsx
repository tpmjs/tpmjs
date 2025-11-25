import { cn } from "@tpmjs/utils/cn";
import { forwardRef } from "react";
import type { GridContainerProps } from "./types";
import { gridContainerVariants } from "./variants";

/**
 * GridContainer component
 *
 * Responsive grid layout container with flexible column and gap options.
 * Built with React and JSX for blueprint/editorial layouts.
 *
 * @example
 * ```tsx
 * import { GridContainer } from '@tpmjs/ui/GridContainer/GridContainer';
 *
 * function MyComponent() {
 *   return (
 *     <GridContainer columns={3} gap="lg">
 *       <div>Item 1</div>
 *       <div>Item 2</div>
 *       <div>Item 3</div>
 *     </GridContainer>
 *   );
 * }
 * ```
 */
export const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
	(
		{
			className,
			columns = "auto",
			gap = "md",
			responsive = "responsive",
			align = "stretch",
			justify = "start",
			children,
			...props
		},
		ref,
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					gridContainerVariants({
						columns,
						gap,
						responsive,
						align,
						justify,
					}),
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	},
);

GridContainer.displayName = "GridContainer";

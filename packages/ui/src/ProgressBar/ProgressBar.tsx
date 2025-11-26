import { cn } from "@tpmjs/utils/cn";
import { forwardRef } from "react";
import type { ProgressBarProps } from "./types";
import { progressBarFillVariants, progressBarTrackVariants } from "./variants";

/**
 * ProgressBar component
 *
 * Displays progress as a horizontal bar with optional label.
 * Supports multiple size and color variants.
 *
 * @example
 * ```tsx
 * import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
 *
 * function MyComponent() {
 *   return (
 *     <ProgressBar
 *       value={75}
 *       variant="success"
 *       size="md"
 *       showLabel
 *     />
 *   );
 * }
 * ```
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
	({ className, value, size = "md", variant = "primary", showLabel = false, ...props }, ref) => {
		// Clamp value between 0 and 100
		const clampedValue = Math.min(Math.max(value, 0), 100);

		if (!showLabel) {
			return (
				<div
					ref={ref}
					className={cn(
						progressBarTrackVariants({
							size,
						}),
						className,
					)}
					role="progressbar"
					aria-valuenow={clampedValue}
					aria-valuemin={0}
					aria-valuemax={100}
					tabIndex={0}
					{...props}
				>
					<div
						className={progressBarFillVariants({
							variant,
						})}
						style={{
							width: `${clampedValue}%`,
						}}
					/>
				</div>
			);
		}

		return (
			<div ref={ref} className="flex items-center gap-3" {...props}>
				<div
					className={cn(
						progressBarTrackVariants({
							size,
						}),
						className,
					)}
					role="progressbar"
					aria-valuenow={clampedValue}
					aria-valuemin={0}
					aria-valuemax={100}
					tabIndex={0}
				>
					<div
						className={progressBarFillVariants({
							variant,
						})}
						style={{
							width: `${clampedValue}%`,
						}}
					/>
				</div>
				<span className="text-sm text-foreground-secondary tabular-nums min-w-[3ch]">
					{Math.round(clampedValue)}%
				</span>
			</div>
		);
	},
);

ProgressBar.displayName = "ProgressBar";

import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { ProgressBarProps } from "./types";
import { progressBarFillVariants, progressBarTrackVariants } from "./variants";

/**
 * ProgressBar component
 *
 * Displays progress as a horizontal bar with optional label.
 * Supports multiple size and color variants.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(ProgressBar, {
 *     value: 75,
 *     variant: 'success',
 *     size: 'md',
 *     showLabel: true,
 *   });
 * }
 * ```
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
	(
		{
			className,
			value,
			size = "md",
			variant = "primary",
			showLabel = false,
			...props
		},
		ref,
	) => {
		// Clamp value between 0 and 100
		const clampedValue = Math.min(Math.max(value, 0), 100);

		if (!showLabel) {
			return createElement(
				"div",
				{
					className: cn(
						progressBarTrackVariants({
							size,
						}),
						className,
					),
					role: "progressbar",
					"aria-valuenow": clampedValue,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					ref,
					...props,
				},
				createElement("div", {
					className: progressBarFillVariants({
						variant,
					}),
					style: {
						width: `${clampedValue}%`,
					},
				}),
			);
		}

		return createElement(
			"div",
			{
				className: "flex items-center gap-3",
				ref,
				...props,
			},
			[
				createElement(
					"div",
					{
						key: "track",
						className: cn(
							progressBarTrackVariants({
								size,
							}),
							className,
						),
						role: "progressbar",
						"aria-valuenow": clampedValue,
						"aria-valuemin": 0,
						"aria-valuemax": 100,
					},
					createElement("div", {
						className: progressBarFillVariants({
							variant,
						}),
						style: {
							width: `${clampedValue}%`,
						},
					}),
				),
				createElement(
					"span",
					{
						key: "label",
						className: "text-sm text-zinc-400 tabular-nums min-w-[3ch]",
					},
					`${Math.round(clampedValue)}%`,
				),
			],
		);
	},
);

ProgressBar.displayName = "ProgressBar";

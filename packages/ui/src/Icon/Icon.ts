import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import { type IconName, icons } from "./icons";
import type { IconProps } from "./types";
import { iconVariants } from "./variants";

export type { IconName };

/**
 * Icon component
 *
 * Renders SVG icons with consistent sizing and styling.
 * Icons inherit text color via currentColor.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Icon } from '@tpmjs/ui/Icon/Icon';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(Icon, {
 *     icon: 'github',
 *     size: 'md',
 *     className: 'text-zinc-400',
 *   });
 * }
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
	({ className, icon, size = "md", ...props }, ref) => {
		const iconData = icons[icon];

		return createElement(
			"svg",
			{
				className: cn(
					iconVariants({
						size,
					}),
					className,
				),
				viewBox: iconData.viewBox,
				fill: "currentColor",
				"aria-hidden": props["aria-hidden"] ?? true,
				ref,
				...props,
			},
			createElement("path", {
				d: iconData.path,
			}),
		);
	},
);

Icon.displayName = "Icon";

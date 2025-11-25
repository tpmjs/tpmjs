import type { SVGAttributes } from "react";
import type { IconName } from "./icons";

/**
 * Icon component props
 */
export interface IconProps
	extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
	/**
	 * Icon to display
	 */
	icon: IconName;

	/**
	 * Size of the icon
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";
}

/**
 * Icon ref type
 */
export type IconRef = SVGSVGElement;

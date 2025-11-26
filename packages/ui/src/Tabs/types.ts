import type { HTMLAttributes } from "react";

/**
 * Tab definition
 */
export interface Tab {
	/**
	 * Unique identifier for the tab
	 */
	id: string;

	/**
	 * Display label for the tab
	 */
	label: string;

	/**
	 * Optional badge count to display
	 */
	count?: number;
}

/**
 * Tabs component props
 */
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
	/**
	 * Array of tabs to display
	 */
	tabs: Tab[];

	/**
	 * Currently active tab ID
	 */
	activeTab: string;

	/**
	 * Callback when tab is changed
	 */
	onTabChange: (tabId: string) => void;

	/**
	 * Size variant
	 * @default 'md'
	 */
	size?: "sm" | "md" | "lg";

	/**
	 * Visual variant
	 * @default 'default'
	 */
	variant?: "default" | "blueprint";
}

/**
 * Tabs ref type
 */
export type TabsRef = HTMLDivElement;

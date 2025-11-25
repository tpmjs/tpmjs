import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef } from "react";
import type { TabsProps } from "./types";
import {
	tabButtonVariants,
	tabCountVariants,
	tabsContainerVariants,
} from "./variants";

/**
 * Tabs component
 *
 * Displays a horizontal list of tabs with optional count badges.
 * Supports keyboard navigation and accessibility.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
 * import { createElement, useState } from 'react';
 *
 * function MyComponent() {
 *   const [activeTab, setActiveTab] = useState('all');
 *
 *   return createElement(Tabs, {
 *     tabs: [
 *       { id: 'all', label: 'All Tools', count: 1234 },
 *       { id: 'featured', label: 'Featured', count: 42 },
 *     ],
 *     activeTab,
 *     onTabChange: setActiveTab,
 *     size: 'md',
 *   });
 * }
 * ```
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
	({ className, tabs, activeTab, onTabChange, size = "md", ...props }, ref) => {
		return createElement(
			"div",
			{
				className: cn(
					tabsContainerVariants({
						size,
					}),
					className,
				),
				role: "tablist",
				ref,
				...props,
			},
			tabs.map((tab) => {
				const isActive = tab.id === activeTab;

				return createElement(
					"button",
					{
						key: tab.id,
						type: "button",
						role: "tab",
						"aria-selected": isActive,
						"aria-controls": `tabpanel-${tab.id}`,
						id: `tab-${tab.id}`,
						className: tabButtonVariants({
							size,
							active: isActive ? "true" : "false",
						}),
						onClick: () => onTabChange(tab.id),
						"data-testid": `tab-${tab.id}`,
					},
					[
						createElement(
							"span",
							{
								key: "label",
							},
							tab.label,
						),
						tab.count !== undefined &&
							createElement(
								"span",
								{
									key: "count",
									className: tabCountVariants({
										active: isActive ? "true" : "false",
									}),
									"aria-label": `${tab.count} items`,
								},
								tab.count.toString(),
							),
					].filter(Boolean),
				);
			}),
		);
	},
);

Tabs.displayName = "Tabs";

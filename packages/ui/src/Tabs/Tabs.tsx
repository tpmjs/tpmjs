import { cn } from "@tpmjs/utils/cn";
import { forwardRef } from "react";
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
 *
 * @example
 * ```tsx
 * import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
 * import { useState } from 'react';
 *
 * function MyComponent() {
 *   const [activeTab, setActiveTab] = useState('all');
 *
 *   return (
 *     <Tabs
 *       tabs={[
 *         { id: 'all', label: 'All Tools', count: 1234 },
 *         { id: 'featured', label: 'Featured', count: 42 },
 *       ]}
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *       size="md"
 *     />
 *   );
 * }
 * ```
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
	(
		{
			className,
			tabs,
			activeTab,
			onTabChange,
			size = "md",
			variant = "default",
			...props
		},
		ref,
	) => {
		return (
			<div
				className={cn(
					tabsContainerVariants({
						size,
						variant,
					}),
					className,
				)}
				role="tablist"
				ref={ref}
				{...props}
			>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTab;

					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`tabpanel-${tab.id}`}
							id={`tab-${tab.id}`}
							className={tabButtonVariants({
								size,
								active: isActive ? "true" : "false",
								variant,
							})}
							onClick={() => onTabChange(tab.id)}
							data-testid={`tab-${tab.id}`}
						>
							<span>{tab.label}</span>
							{tab.count !== undefined && (
								<span
									className={tabCountVariants({
										active: isActive ? "true" : "false",
									})}
									aria-label={`${tab.count} items`}
								>
									{tab.count.toString()}
								</span>
							)}
						</button>
					);
				})}
			</div>
		);
	},
);

Tabs.displayName = "Tabs";

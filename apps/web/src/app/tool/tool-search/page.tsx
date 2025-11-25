"use client";

import { Badge } from "@tpmjs/ui/Badge/Badge";
import { Button } from "@tpmjs/ui/Button/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tpmjs/ui/Card/Card";
import { CodeBlock } from "@tpmjs/ui/CodeBlock/CodeBlock";
import { Container } from "@tpmjs/ui/Container/Container";
import { Header } from "@tpmjs/ui/Header/Header";
import { Icon } from "@tpmjs/ui/Icon/Icon";
import { Input } from "@tpmjs/ui/Input/Input";
import { ProgressBar } from "@tpmjs/ui/ProgressBar/ProgressBar";
import { Tabs } from "@tpmjs/ui/Tabs/Tabs";
import { createElement, useState } from "react";
import { getFeaturedTools, mockTools } from "../../../data/toolData";

/**
 * Tool Registry Search Page
 *
 * Demonstrates all UI components in a realistic tool registry layout.
 * Built with .ts-only React using createElement.
 */
export default function ToolSearchPage(): React.ReactElement {
	const [activeTab, setActiveTab] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Get tools based on active tab
	const displayedTools =
		activeTab === "featured" ? getFeaturedTools() : mockTools;

	// Filter by search query
	const filteredTools = searchQuery
		? displayedTools.filter(
				(tool) =>
					tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: displayedTools;

	return createElement("div", { className: "min-h-screen bg-black" }, [
		// Header
		createElement(Header, {
			key: "header",
			title: createElement("div", { className: "flex items-center gap-2" }, [
				createElement(
					"span",
					{ key: "title", className: "text-2xl font-bold" },
					"TPMJS",
				),
				createElement(
					Badge,
					{ key: "badge", variant: "outline", size: "sm" },
					"Beta",
				),
			]),
			actions: createElement("div", { className: "flex items-center gap-3" }, [
				createElement(
					Button,
					{ key: "docs", variant: "ghost", size: "sm" },
					"Docs",
				),
				createElement(
					"a",
					{
						key: "github",
						href: "https://github.com/tpmjs/tpmjs",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					},
					createElement(Icon, { icon: "github", size: "md" }),
				),
				createElement(
					Button,
					{ key: "publish", variant: "default", size: "sm" },
					"Publish Tool",
				),
			]),
			sticky: true,
			size: "md",
		}),

		// Main content
		createElement(
			Container,
			{ key: "container", size: "xl", padding: "md", className: "py-8" },
			[
				// Page header
				createElement(
					"div",
					{ key: "page-header", className: "space-y-4 mb-8" },
					[
						createElement(
							"h1",
							{ key: "title", className: "text-4xl font-bold text-zinc-100" },
							"Tool Registry",
						),
						createElement(
							"p",
							{ key: "description", className: "text-lg text-zinc-400" },
							"Discover, share, and integrate tools that give your AI agents superpowers.",
						),
					],
				),

				// Search input
				createElement(Input, {
					key: "search",
					placeholder: "Search tools...",
					value: searchQuery,
					onChange: (e) => setSearchQuery(e.target.value),
					className: "mb-6",
				}),

				// Tabs
				createElement(Tabs, {
					key: "tabs",
					tabs: [
						{ id: "all", label: "All Tools", count: mockTools.length },
						{
							id: "featured",
							label: "Featured",
							count: getFeaturedTools().length,
						},
					],
					activeTab,
					onTabChange: setActiveTab,
					size: "md",
					className: "mb-8",
				}),

				// Tool grid
				createElement(
					"div",
					{
						key: "tools-grid",
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
					},
					filteredTools.length > 0
						? filteredTools.map((tool) =>
								createElement(
									Card,
									{ key: tool.id, className: "flex flex-col" },
									[
										createElement(CardHeader, { key: "header" }, [
											createElement(
												"div",
												{
													key: "title-row",
													className: "flex items-start justify-between gap-2",
												},
												[
													createElement(CardTitle, { key: "title" }, tool.name),
													createElement(
														"a",
														{
															key: "link",
															href: tool.repository,
															target: "_blank",
															rel: "noopener noreferrer",
															className:
																"text-zinc-400 hover:text-zinc-100 transition-colors",
														},
														createElement(Icon, {
															icon: "externalLink",
															size: "sm",
														}),
													),
												],
											),
											createElement(
												CardDescription,
												{ key: "description" },
												tool.description,
											),
										]),
										createElement(
											CardContent,
											{ key: "content", className: "flex-1 space-y-4" },
											[
												// Category badge
												createElement(
													"div",
													{
														key: "category",
														className: "flex items-center gap-2",
													},
													[
														createElement(
															Badge,
															{
																key: "badge",
																variant: "secondary",
																size: "sm",
															},
															tool.category,
														),
														createElement(
															"span",
															{
																key: "version",
																className: "text-xs text-zinc-500",
															},
															`v${tool.version}`,
														),
													],
												),

												// Tags
												createElement(
													"div",
													{ key: "tags", className: "flex flex-wrap gap-2" },
													tool.tags.map((tag) =>
														createElement(
															Badge,
															{ key: tag, variant: "outline", size: "sm" },
															tag,
														),
													),
												),

												// Usage progress
												createElement(
													"div",
													{ key: "usage", className: "space-y-2" },
													[
														createElement(
															"div",
															{
																key: "label",
																className:
																	"flex items-center justify-between text-sm",
															},
															[
																createElement(
																	"span",
																	{ key: "text", className: "text-zinc-400" },
																	"Usage",
																),
																createElement(
																	"span",
																	{ key: "stars", className: "text-zinc-500" },
																	`⭐ ${tool.stars.toLocaleString()}`,
																),
															],
														),
														createElement(ProgressBar, {
															key: "progress",
															value: tool.usage,
															variant:
																tool.usage >= 70
																	? "success"
																	: tool.usage >= 50
																		? "primary"
																		: "warning",
															size: "sm",
															showLabel: true,
														}),
													],
												),

												// Install command
												createElement(CodeBlock, {
													key: "install",
													code: tool.installCommand,
													language: "bash",
													size: "sm",
													showCopy: true,
												}),
											],
										),
										createElement(
											CardFooter,
											{ key: "footer" },
											createElement(
												Button,
												{ variant: "outline", size: "sm", className: "w-full" },
												"View Details",
											),
										),
									],
								),
							)
						: [
								createElement(
									"div",
									{
										key: "no-results",
										className: "col-span-full text-center py-12 text-zinc-500",
									},
									`No tools found matching "${searchQuery}"`,
								),
							],
				),
			],
		),
	]);
}

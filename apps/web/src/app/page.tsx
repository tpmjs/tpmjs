import { Badge } from "@tpmjs/ui/Badge/Badge";
import { Button } from "@tpmjs/ui/Button/Button";
import { Card, CardContent } from "@tpmjs/ui/Card/Card";
import { Container } from "@tpmjs/ui/Container/Container";
import { Header } from "@tpmjs/ui/Header/Header";
import { Icon } from "@tpmjs/ui/Icon/Icon";
import { Input } from "@tpmjs/ui/Input/Input";
import { createElement } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { categories, featuredTools, statistics } from "../data/homePageData";

export default function HomePage(): React.ReactElement {
	return createElement(
		"div",
		{ className: "min-h-screen flex flex-col" },
		// Header
		createElement(Header, {
			title: "TPMJS",
			size: "md",
			sticky: true,
			actions: createElement(
				"div",
				{ className: "flex items-center gap-4" },
				createElement(Button, { variant: "ghost", size: "sm" }, "Pro"),
				createElement(Button, { variant: "ghost", size: "sm" }, "Teams"),
				createElement(Button, { variant: "ghost", size: "sm" }, "Pricing"),
				createElement(
					Button,
					{ variant: "ghost", size: "sm" },
					"Documentation",
				),
				createElement(Button, { variant: "outline", size: "sm" }, "Sign In"),
				createElement(Button, { size: "sm" }, "Sign Up"),
				createElement(ThemeToggle, {}),
			),
		}),

		createElement(
			"main",
			{ className: "flex-1" },
			// Hero Section
			createElement(
				"section",
				{ className: "relative py-24 overflow-hidden" },
				createElement("div", {
					className:
						"absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 opacity-10",
				}),
				createElement(
					Container,
					{ size: "xl", padding: "lg" },
					createElement(
						"div",
						{
							className:
								"max-w-3xl mx-auto text-center space-y-8 relative z-10",
						},
						createElement(
							"h1",
							{ className: "text-5xl md:text-6xl font-bold tracking-tight" },
							"Tool Registry for AI Agents",
						),
						createElement(
							"p",
							{ className: "text-xl text-foreground-secondary" },
							"Discover, share, and integrate tools that give your agents superpowers. The registry for AI tools.",
						),
						createElement(
							"div",
							{ className: "flex gap-3 items-center max-w-2xl mx-auto" },
							createElement(Input, {
								size: "lg",
								placeholder: "Search tools...",
								className: "flex-1",
							}),
							createElement(
								Button,
								{ size: "lg", className: "px-8" },
								"Search",
							),
						),
					),
				),
			),

			// Featured Tools Section
			createElement(
				"section",
				{ className: "py-16 bg-surface" },
				createElement(
					Container,
					{ size: "xl", padding: "lg" },
					createElement(
						"div",
						{ className: "flex items-center justify-between mb-8" },
						createElement(
							"h2",
							{ className: "text-3xl font-semibold" },
							"Featured Tools",
						),
						createElement(Button, { variant: "ghost" }, "View all tools →"),
					),
					createElement(
						"div",
						{
							className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
						},
						...featuredTools.map((tool) =>
							createElement(
								Card,
								{
									key: tool.id,
									className: "hover:shadow-lg transition-shadow",
								},
								createElement(
									CardContent,
									{ className: "p-6 space-y-4" },
									createElement(
										"div",
										{ className: "flex items-start gap-4" },
										createElement(Icon, {
											icon: tool.icon,
											size: "lg",
											className: "text-primary",
										}),
										createElement(
											"div",
											{ className: "flex-1 space-y-2" },
											createElement(
												"h3",
												{ className: "text-lg font-semibold" },
												tool.name,
											),
											createElement(
												"p",
												{ className: "text-sm text-foreground-secondary" },
												tool.description,
											),
											createElement(
												"div",
												{ className: "flex items-center gap-2" },
												createElement(
													Badge,
													{ variant: tool.categoryVariant, size: "sm" },
													tool.category,
												),
												createElement(
													"span",
													{ className: "text-xs text-foreground-tertiary" },
													tool.weeklyUsage,
												),
											),
										),
									),
								),
							),
						),
					),
				),
			),

			// Categories Section
			createElement(
				"section",
				{ className: "py-16" },
				createElement(
					Container,
					{ size: "xl", padding: "lg" },
					createElement(
						"h2",
						{ className: "text-3xl font-semibold mb-8" },
						"Browse by Category",
					),
					createElement(
						"div",
						{
							className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
						},
						...categories.map((category) =>
							createElement(
								Card,
								{
									key: category.id,
									className: "hover:shadow-lg transition-shadow cursor-pointer",
								},
								createElement(
									CardContent,
									{ className: `p-6 ${category.colorClass}` },
									createElement(
										"div",
										{ className: "space-y-3" },
										createElement(Icon, {
											icon: category.icon,
											size: "lg",
										}),
										createElement(
											"h3",
											{ className: "font-semibold" },
											category.name,
										),
										createElement(
											"p",
											{ className: "text-sm opacity-90" },
											`${category.toolCount} tools`,
										),
									),
								),
							),
						),
					),
				),
			),

			// Statistics Section
			createElement(
				"section",
				{ className: "py-16 bg-surface" },
				createElement(
					Container,
					{ size: "xl", padding: "lg" },
					createElement(
						"h2",
						{ className: "text-3xl font-semibold mb-8 text-center" },
						"Platform Statistics",
					),
					createElement(
						"div",
						{
							className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
						},
						...statistics.map((stat, index) =>
							createElement(
								Card,
								{ key: index },
								createElement(
									CardContent,
									{ className: "p-6 text-center space-y-3" },
									createElement(Icon, {
										icon: stat.icon,
										size: "lg",
										className: "mx-auto text-primary",
									}),
									createElement(
										"div",
										{ className: "text-4xl font-bold" },
										stat.value,
									),
									createElement(
										"div",
										{ className: "text-sm font-medium" },
										stat.label,
									),
									stat.subtext &&
										createElement(
											"div",
											{ className: "text-xs text-foreground-tertiary" },
											stat.subtext,
										),
								),
							),
						),
					),
				),
			),
		),

		// Footer
		createElement(
			"footer",
			{ className: "py-8 border-t border-border bg-surface" },
			createElement(
				Container,
				{ size: "xl", padding: "lg" },
				createElement(
					"div",
					{
						className:
							"flex flex-col md:flex-row items-center justify-between gap-4",
					},
					createElement(
						"p",
						{ className: "text-sm text-foreground-secondary" },
						"© 2025 TPMJS. All rights reserved.",
					),
					createElement(
						"div",
						{ className: "flex items-center gap-4 text-sm" },
						createElement(
							"a",
							{
								href: "#",
								className: "text-foreground-secondary hover:text-foreground",
							},
							"Privacy",
						),
						createElement("span", { className: "text-border" }, "·"),
						createElement(
							"a",
							{
								href: "#",
								className: "text-foreground-secondary hover:text-foreground",
							},
							"Terms",
						),
						createElement("span", { className: "text-border" }, "·"),
						createElement(
							"a",
							{
								href: "#",
								className: "text-foreground-secondary hover:text-foreground",
							},
							"Contact",
						),
					),
				),
			),
		),
	);
}

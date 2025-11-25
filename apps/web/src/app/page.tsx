import { Badge } from "@tpmjs/ui/Badge/Badge";
import { Button } from "@tpmjs/ui/Button/Button";
import { Card, CardContent } from "@tpmjs/ui/Card/Card";
import { Container } from "@tpmjs/ui/Container/Container";
import { Header } from "@tpmjs/ui/Header/Header";
import { Icon } from "@tpmjs/ui/Icon/Icon";
import { Input } from "@tpmjs/ui/Input/Input";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";
import { categories, featuredTools, statistics } from "../data/homePageData";

export default function HomePage(): React.ReactElement {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<Header
				title={
					<Link href="/" className="text-foreground hover:text-foreground">
						TPMJS
					</Link>
				}
				size="md"
				sticky={true}
				actions={
					<div className="flex items-center gap-4">
						<Link href="/playground">
							<Button
								variant="ghost"
								size="sm"
								className="text-foreground hover:text-foreground"
							>
								Playground
							</Button>
						</Link>
						<Button
							variant="ghost"
							size="sm"
							className="text-foreground hover:text-foreground"
						>
							Pro
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-foreground hover:text-foreground"
						>
							Teams
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-foreground hover:text-foreground"
						>
							Pricing
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-foreground hover:text-foreground"
						>
							Documentation
						</Button>
						<Button variant="secondary" size="sm">
							Sign In
						</Button>
						<Button size="sm">Sign Up</Button>
						<ThemeToggle />
					</div>
				}
			/>

			<main className="flex-1">
				{/* Hero Section */}
				<section className="relative py-24 overflow-hidden dotted-grid-background">
					<div className="absolute inset-0 bg-background/95" />
					<Container size="xl" padding="lg">
						<div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
							<h1 className="text-5xl md:text-6xl font-bold tracking-tight">
								Tool Registry for AI Agents
							</h1>
							<p className="text-xl text-foreground-secondary">
								Discover, share, and integrate tools that give your agents
								superpowers. The registry for AI tools.
							</p>
							<div className="flex gap-3 items-center max-w-2xl mx-auto">
								<Input
									size="lg"
									placeholder="Search tools..."
									className="flex-1"
								/>
								<Button size="lg" className="px-8">
									Search
								</Button>
							</div>
						</div>
					</Container>
				</section>

				{/* Featured Tools Section */}
				<section className="py-16 bg-surface blueprint-background">
					<Container size="xl" padding="lg">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-semibold">Featured Tools</h2>
							<Button variant="ghost">View all tools →</Button>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{featuredTools.map((tool) => (
								<Card
									key={tool.id}
									className="hover:shadow-lg transition-shadow"
								>
									<CardContent className="p-6 space-y-4">
										<div className="flex items-start gap-4">
											<Icon
												icon={tool.icon}
												size="lg"
												className="text-primary"
											/>
											<div className="flex-1 space-y-2">
												<h3 className="text-lg font-semibold">{tool.name}</h3>
												<p className="text-sm text-foreground-secondary">
													{tool.description}
												</p>
												<div className="flex items-center gap-2">
													<Badge variant={tool.categoryVariant} size="sm">
														{tool.category}
													</Badge>
													<span className="text-xs text-foreground-tertiary">
														{tool.weeklyUsage}
													</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</Container>
				</section>

				{/* Categories Section */}
				<section className="py-16">
					<Container size="xl" padding="lg">
						<h2 className="text-3xl font-semibold mb-8">Browse by Category</h2>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{categories.map((category) => (
								<Card
									key={category.id}
									className="hover:shadow-lg transition-shadow cursor-pointer"
								>
									<CardContent className={`p-6 ${category.colorClass}`}>
										<div className="space-y-3">
											<Icon icon={category.icon} size="lg" />
											<h3 className="font-semibold">{category.name}</h3>
											<p className="text-sm opacity-90">
												{category.toolCount} tools
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</Container>
				</section>

				{/* Statistics Section */}
				<section className="py-16 bg-surface grid-background">
					<Container size="xl" padding="lg">
						<h2 className="text-3xl font-semibold mb-8 text-center">
							Platform Statistics
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{statistics.map((stat) => (
								<Card key={stat.label}>
									<CardContent className="p-6 text-center space-y-3">
										<Icon
											icon={stat.icon}
											size="lg"
											className="mx-auto text-primary"
										/>
										<div className="text-4xl font-bold">{stat.value}</div>
										<div className="text-sm font-medium">{stat.label}</div>
										{stat.subtext && (
											<div className="text-xs text-foreground-tertiary">
												{stat.subtext}
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</Container>
				</section>
			</main>

			{/* Footer */}
			<footer className="py-8 border-t border-border bg-surface">
				<Container size="xl" padding="lg">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-sm text-foreground-secondary">
							© 2025 TPMJS. All rights reserved.
						</p>
						<div className="flex items-center gap-4 text-sm">
							<button
								type="button"
								className="text-foreground-secondary hover:text-foreground"
							>
								Privacy
							</button>
							<span className="text-border">·</span>
							<button
								type="button"
								className="text-foreground-secondary hover:text-foreground"
							>
								Terms
							</button>
							<span className="text-border">·</span>
							<button
								type="button"
								className="text-foreground-secondary hover:text-foreground"
							>
								Contact
							</button>
						</div>
					</div>
				</Container>
			</footer>
		</div>
	);
}

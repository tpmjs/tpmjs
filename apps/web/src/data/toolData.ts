/**
 * Mock data for tool registry
 * Represents tools available in the TPMJS registry
 */

export interface Tool {
	id: string;
	name: string;
	description: string;
	category: string;
	installCommand: string;
	usage: number; // 0-100 percentage
	stars: number;
	version: string;
	tags: string[];
	homepage?: string;
	repository?: string;
}

export const toolCategories = [
	"Web & APIs",
	"Databases",
	"Documents",
	"Images",
	"Email",
	"Calendar",
	"Search",
	"Code Execution",
	"Communication",
	"Analytics",
	"Security",
	"Workflows",
] as const;

export const mockTools: Tool[] = [
	{
		id: "web-fetch",
		name: "web-fetch",
		description:
			"Fetch and parse web content with automatic HTML-to-markdown conversion",
		category: "Web & APIs",
		installCommand: "npm install @tpmjs/web-fetch",
		usage: 87,
		stars: 12453,
		version: "2.1.4",
		tags: ["http", "scraping", "markdown"],
		homepage: "https://tpmjs.com/tools/web-fetch",
		repository: "https://github.com/tpmjs/web-fetch",
	},
	{
		id: "database-query",
		name: "database-query",
		description:
			"Execute SQL queries across multiple database engines with type-safe results",
		category: "Databases",
		installCommand: "npm install @tpmjs/database-query",
		usage: 72,
		stars: 8921,
		version: "3.0.1",
		tags: ["sql", "postgres", "mysql", "sqlite"],
		homepage: "https://tpmjs.com/tools/database-query",
		repository: "https://github.com/tpmjs/database-query",
	},
	{
		id: "pdf-extract",
		name: "pdf-extract",
		description:
			"Extract text, images, and metadata from PDF documents with OCR support",
		category: "Documents",
		installCommand: "npm install @tpmjs/pdf-extract",
		usage: 65,
		stars: 7832,
		version: "1.9.2",
		tags: ["pdf", "ocr", "document-processing"],
		homepage: "https://tpmjs.com/tools/pdf-extract",
		repository: "https://github.com/tpmjs/pdf-extract",
	},
	{
		id: "image-transform",
		name: "image-transform",
		description:
			"Resize, crop, and optimize images with automatic format conversion",
		category: "Images",
		installCommand: "npm install @tpmjs/image-transform",
		usage: 58,
		stars: 6745,
		version: "2.4.0",
		tags: ["images", "resize", "optimization"],
		homepage: "https://tpmjs.com/tools/image-transform",
		repository: "https://github.com/tpmjs/image-transform",
	},
	{
		id: "email-send",
		name: "email-send",
		description:
			"Send transactional emails with template support and delivery tracking",
		category: "Email",
		installCommand: "npm install @tpmjs/email-send",
		usage: 51,
		stars: 5623,
		version: "1.7.3",
		tags: ["email", "smtp", "templates"],
		homepage: "https://tpmjs.com/tools/email-send",
		repository: "https://github.com/tpmjs/email-send",
	},
	{
		id: "calendar-sync",
		name: "calendar-sync",
		description:
			"Sync events across Google Calendar, Outlook, and Apple Calendar",
		category: "Calendar",
		installCommand: "npm install @tpmjs/calendar-sync",
		usage: 43,
		stars: 4891,
		version: "2.0.5",
		tags: ["calendar", "events", "sync"],
		homepage: "https://tpmjs.com/tools/calendar-sync",
		repository: "https://github.com/tpmjs/calendar-sync",
	},
	{
		id: "semantic-search",
		name: "semantic-search",
		description:
			"Vector-based semantic search with support for embeddings and similarity",
		category: "Search",
		installCommand: "npm install @tpmjs/semantic-search",
		usage: 79,
		stars: 11234,
		version: "3.2.1",
		tags: ["search", "embeddings", "vector", "ai"],
		homepage: "https://tpmjs.com/tools/semantic-search",
		repository: "https://github.com/tpmjs/semantic-search",
	},
	{
		id: "code-execute",
		name: "code-execute",
		description:
			"Safely execute code in sandboxed environments with timeout controls",
		category: "Code Execution",
		installCommand: "npm install @tpmjs/code-execute",
		usage: 68,
		stars: 9567,
		version: "1.5.8",
		tags: ["sandbox", "execution", "security"],
		homepage: "https://tpmjs.com/tools/code-execute",
		repository: "https://github.com/tpmjs/code-execute",
	},
	{
		id: "slack-notify",
		name: "slack-notify",
		description:
			"Send rich notifications to Slack channels with interactive components",
		category: "Communication",
		installCommand: "npm install @tpmjs/slack-notify",
		usage: 54,
		stars: 6234,
		version: "2.3.2",
		tags: ["slack", "notifications", "webhooks"],
		homepage: "https://tpmjs.com/tools/slack-notify",
		repository: "https://github.com/tpmjs/slack-notify",
	},
	{
		id: "analytics-track",
		name: "analytics-track",
		description:
			"Track user events and metrics across multiple analytics platforms",
		category: "Analytics",
		installCommand: "npm install @tpmjs/analytics-track",
		usage: 61,
		stars: 7123,
		version: "1.8.4",
		tags: ["analytics", "tracking", "metrics"],
		homepage: "https://tpmjs.com/tools/analytics-track",
		repository: "https://github.com/tpmjs/analytics-track",
	},
	{
		id: "secret-vault",
		name: "secret-vault",
		description:
			"Securely store and retrieve secrets with encryption and access control",
		category: "Security",
		installCommand: "npm install @tpmjs/secret-vault",
		usage: 76,
		stars: 10432,
		version: "2.6.0",
		tags: ["security", "secrets", "encryption"],
		homepage: "https://tpmjs.com/tools/secret-vault",
		repository: "https://github.com/tpmjs/secret-vault",
	},
	{
		id: "workflow-orchestrate",
		name: "workflow-orchestrate",
		description:
			"Orchestrate complex workflows with conditional logic and error handling",
		category: "Workflows",
		installCommand: "npm install @tpmjs/workflow-orchestrate",
		usage: 47,
		stars: 5789,
		version: "3.1.2",
		tags: ["workflows", "orchestration", "automation"],
		homepage: "https://tpmjs.com/tools/workflow-orchestrate",
		repository: "https://github.com/tpmjs/workflow-orchestrate",
	},
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string): Tool[] {
	return mockTools.filter((tool) => tool.category === category);
}

/**
 * Get featured tools (top 6 by usage)
 */
export function getFeaturedTools(): Tool[] {
	return [...mockTools].sort((a, b) => b.usage - a.usage).slice(0, 6);
}

/**
 * Get tool by ID
 */
export function getToolById(id: string): Tool | undefined {
	return mockTools.find((tool) => tool.id === id);
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): Tool[] {
	const lowerQuery = query.toLowerCase();
	return mockTools.filter(
		(tool) =>
			tool.name.toLowerCase().includes(lowerQuery) ||
			tool.description.toLowerCase().includes(lowerQuery) ||
			tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
	);
}

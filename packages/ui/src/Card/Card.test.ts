import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./Card";

describe("Card", () => {
	describe("Rendering", () => {
		it("renders a card element", () => {
			render(createElement(Card, { "data-testid": "card" }, "Card content"));
			const card = screen.getByTestId("card");
			expect(card).toBeInTheDocument();
			expect(card.tagName).toBe("DIV");
		});

		it("renders with all sub-components", () => {
			render(
				createElement(
					Card,
					{ "data-testid": "card" },
					createElement(
						CardHeader,
						{ "data-testid": "header" },
						createElement(CardTitle, { "data-testid": "title" }, "Title"),
						createElement(
							CardDescription,
							{ "data-testid": "description" },
							"Description",
						),
					),
					createElement(CardContent, { "data-testid": "content" }, "Content"),
					createElement(CardFooter, { "data-testid": "footer" }, "Footer"),
				),
			);

			expect(screen.getByTestId("card")).toBeInTheDocument();
			expect(screen.getByTestId("header")).toBeInTheDocument();
			expect(screen.getByTestId("title")).toBeInTheDocument();
			expect(screen.getByTestId("description")).toBeInTheDocument();
			expect(screen.getByTestId("content")).toBeInTheDocument();
			expect(screen.getByTestId("footer")).toBeInTheDocument();
		});
	});

	describe("Card Variants", () => {
		it("applies default variant classes", () => {
			render(
				createElement(
					Card,
					{
						variant: "default",
						"data-testid": "card",
					},
					"Default",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("border");
			expect(card.className).toContain("bg-card");
			expect(card.className).toContain("shadow-sm");
		});

		it("applies elevated variant classes", () => {
			render(
				createElement(
					Card,
					{
						variant: "elevated",
						"data-testid": "card",
					},
					"Elevated",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("bg-surface-elevated");
			expect(card.className).toContain("shadow-md");
		});

		it("applies outline variant classes", () => {
			render(
				createElement(
					Card,
					{
						variant: "outline",
						"data-testid": "card",
					},
					"Outline",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("border-2");
			expect(card.className).toContain("bg-transparent");
		});

		it("applies ghost variant classes", () => {
			render(
				createElement(
					Card,
					{
						variant: "ghost",
						"data-testid": "card",
					},
					"Ghost",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("bg-transparent");
		});
	});

	describe("Card Padding", () => {
		it("applies no padding by default", () => {
			render(
				createElement(
					Card,
					{
						"data-testid": "card",
					},
					"No padding",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-0");
		});

		it("applies small padding", () => {
			render(
				createElement(
					Card,
					{
						padding: "sm",
						"data-testid": "card",
					},
					"Small padding",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-4");
		});

		it("applies medium padding", () => {
			render(
				createElement(
					Card,
					{
						padding: "md",
						"data-testid": "card",
					},
					"Medium padding",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-6");
		});

		it("applies large padding", () => {
			render(
				createElement(
					Card,
					{
						padding: "lg",
						"data-testid": "card",
					},
					"Large padding",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-8");
		});
	});

	describe("CardHeader", () => {
		it("renders with default medium padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(CardHeader, { "data-testid": "header" }, "Header"),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-6");
		});

		it("applies small padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{ padding: "sm", "data-testid": "header" },
						"Header",
					),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-4");
		});

		it("applies large padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{ padding: "lg", "data-testid": "header" },
						"Header",
					),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-8");
		});

		it("applies no padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{ padding: "none", "data-testid": "header" },
						"Header",
					),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-0");
		});
	});

	describe("CardTitle", () => {
		it("renders as h3 by default", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(CardTitle, { "data-testid": "title" }, "Title"),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H3");
		});

		it("renders as h1 when specified", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardTitle,
							{ as: "h1", "data-testid": "title" },
							"Title",
						),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H1");
		});

		it("renders as h2 when specified", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardTitle,
							{ as: "h2", "data-testid": "title" },
							"Title",
						),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H2");
		});

		it("applies title classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(CardTitle, { "data-testid": "title" }, "Title"),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.className).toContain("text-2xl");
			expect(title.className).toContain("font-semibold");
			expect(title.className).toContain("leading-none");
		});
	});

	describe("CardDescription", () => {
		it("renders as a paragraph", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardDescription,
							{ "data-testid": "description" },
							"Description text",
						),
					),
				),
			);
			const description = screen.getByTestId("description");
			expect(description.tagName).toBe("P");
		});

		it("applies description classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardDescription,
							{ "data-testid": "description" },
							"Description",
						),
					),
				),
			);
			const description = screen.getByTestId("description");
			expect(description.className).toContain("text-sm");
			expect(description.className).toContain("text-foreground-secondary");
		});
	});

	describe("CardContent", () => {
		it("renders with default medium padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(CardContent, { "data-testid": "content" }, "Content"),
				),
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-6");
			expect(content.className).toContain("pt-0");
		});

		it("applies small padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardContent,
						{ padding: "sm", "data-testid": "content" },
						"Content",
					),
				),
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-4");
			expect(content.className).toContain("pt-0");
		});

		it("applies large padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardContent,
						{ padding: "lg", "data-testid": "content" },
						"Content",
					),
				),
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-8");
			expect(content.className).toContain("pt-0");
		});

		it("applies no padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardContent,
						{ padding: "none", "data-testid": "content" },
						"Content",
					),
				),
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-0");
		});
	});

	describe("CardFooter", () => {
		it("renders with default medium padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(CardFooter, { "data-testid": "footer" }, "Footer"),
				),
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-6");
			expect(footer.className).toContain("pt-0");
		});

		it("applies small padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardFooter,
						{ padding: "sm", "data-testid": "footer" },
						"Footer",
					),
				),
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-4");
			expect(footer.className).toContain("pt-0");
		});

		it("applies large padding", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardFooter,
						{ padding: "lg", "data-testid": "footer" },
						"Footer",
					),
				),
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-8");
			expect(footer.className).toContain("pt-0");
		});

		it("applies flex layout classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(CardFooter, { "data-testid": "footer" }, "Footer"),
				),
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("items-center");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with Card variant classes", () => {
			render(
				createElement(
					Card,
					{
						className: "custom-card",
						"data-testid": "card",
					},
					"Custom",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("custom-card");
			expect(card.className).toContain("rounded-lg");
		});

		it("merges custom className with CardHeader", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{
							className: "custom-header",
							"data-testid": "header",
						},
						"Header",
					),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("custom-header");
			expect(header.className).toContain("flex");
		});

		it("merges custom className with CardTitle", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardTitle,
							{
								className: "custom-title",
								"data-testid": "title",
							},
							"Title",
						),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.className).toContain("custom-title");
			expect(title.className).toContain("font-semibold");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to Card element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Card,
					{
						ref: (el: HTMLDivElement | null) => {
							ref = el;
						},
					},
					"Card",
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref?.tagName).toBe("DIV");
		});

		it("forwards ref to CardHeader element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{
							ref: (el: HTMLDivElement | null) => {
								ref = el;
							},
						},
						"Header",
					),
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});

		it("forwards ref to CardTitle element", () => {
			let ref: HTMLHeadingElement | null = null;
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardTitle,
							{
								ref: (el: HTMLHeadingElement | null) => {
									ref = el;
								},
							},
							"Title",
						),
					),
				),
			);
			expect(ref).toBeInstanceOf(HTMLHeadingElement);
			expect(ref?.tagName).toBe("H3");
		});

		it("forwards ref to CardDescription element", () => {
			let ref: HTMLParagraphElement | null = null;
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardDescription,
							{
								ref: (el: HTMLParagraphElement | null) => {
									ref = el;
								},
							},
							"Description",
						),
					),
				),
			);
			expect(ref).toBeInstanceOf(HTMLParagraphElement);
		});

		it("forwards ref to CardContent element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Card,
					null,
					createElement(
						CardContent,
						{
							ref: (el: HTMLDivElement | null) => {
								ref = el;
							},
						},
						"Content",
					),
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});

		it("forwards ref to CardFooter element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Card,
					null,
					createElement(
						CardFooter,
						{
							ref: (el: HTMLDivElement | null) => {
								ref = el;
							},
						},
						"Footer",
					),
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});
	});

	describe("HTML Attributes", () => {
		it("passes through HTML attributes to Card", () => {
			render(
				createElement(
					Card,
					{
						id: "test-card",
						"data-testid": "card",
						role: "article",
					},
					"Card",
				),
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveAttribute("id", "test-card");
			expect(card).toHaveAttribute("role", "article");
		});

		it("passes through onClick handler to Card", () => {
			let clicked = false;
			render(
				createElement(
					Card,
					{
						onClick: () => {
							clicked = true;
						},
						"data-testid": "card",
					},
					"Clickable Card",
				),
			);
			const card = screen.getByTestId("card");
			card.click();
			expect(clicked).toBe(true);
		});
	});

	describe("Base Classes", () => {
		it("Card always includes base classes", () => {
			render(
				createElement(
					Card,
					{
						"data-testid": "card",
					},
					"Card",
				),
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("relative");
			expect(card.className).toContain("rounded-lg");
			expect(card.className).toContain("transition-base");
		});

		it("CardHeader always includes base classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						{
							"data-testid": "header",
						},
						"Header",
					),
				),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("flex");
			expect(header.className).toContain("flex-col");
		});

		it("CardTitle always includes base classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardTitle,
							{
								"data-testid": "title",
							},
							"Title",
						),
					),
				),
			);
			const title = screen.getByTestId("title");
			expect(title.className).toContain("text-2xl");
			expect(title.className).toContain("font-semibold");
			expect(title.className).toContain("leading-none");
			expect(title.className).toContain("tracking-tight");
		});

		it("CardDescription always includes base classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardHeader,
						null,
						createElement(
							CardDescription,
							{
								"data-testid": "description",
							},
							"Description",
						),
					),
				),
			);
			const description = screen.getByTestId("description");
			expect(description.className).toContain("text-sm");
			expect(description.className).toContain("text-foreground-secondary");
			expect(description.className).toContain("mt-1.5");
		});

		it("CardFooter always includes base classes", () => {
			render(
				createElement(
					Card,
					null,
					createElement(
						CardFooter,
						{
							"data-testid": "footer",
						},
						"Footer",
					),
				),
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("items-center");
		});
	});

	describe("Complex Composition", () => {
		it("renders a complete card with all sections", () => {
			render(
				createElement(
					Card,
					{ variant: "elevated", "data-testid": "card" },
					createElement(
						CardHeader,
						{ "data-testid": "header" },
						createElement(CardTitle, null, "Card Title"),
						createElement(CardDescription, null, "This is a card description"),
					),
					createElement(
						CardContent,
						{ "data-testid": "content" },
						"Card content goes here",
					),
					createElement(
						CardFooter,
						{ "data-testid": "footer" },
						"Footer actions",
					),
				),
			);

			const card = screen.getByTestId("card");
			expect(card).toBeInTheDocument();
			expect(screen.getByText("Card Title")).toBeInTheDocument();
			expect(
				screen.getByText("This is a card description"),
			).toBeInTheDocument();
			expect(screen.getByText("Card content goes here")).toBeInTheDocument();
			expect(screen.getByText("Footer actions")).toBeInTheDocument();
		});

		it("maintains proper structure hierarchy", () => {
			render(
				createElement(
					Card,
					{ "data-testid": "card" },
					createElement(
						CardHeader,
						{ "data-testid": "header" },
						createElement(CardTitle, null, "Title"),
					),
					createElement(CardContent, { "data-testid": "content" }, "Content"),
				),
			);

			const card = screen.getByTestId("card");
			const header = screen.getByTestId("header");
			const content = screen.getByTestId("content");

			expect(card.contains(header)).toBe(true);
			expect(card.contains(content)).toBe(true);
		});
	});
});

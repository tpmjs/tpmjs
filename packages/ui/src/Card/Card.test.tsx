import { render, screen } from "@testing-library/react";
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
			render(<Card data-testid="card">Card content</Card>);
			const card = screen.getByTestId("card");
			expect(card).toBeInTheDocument();
			expect(card.tagName).toBe("DIV");
		});

		it("renders with all sub-components", () => {
			render(
				<Card data-testid="card">
					<CardHeader data-testid="header">
						<CardTitle data-testid="title">Title</CardTitle>
						<CardDescription data-testid="description">
							Description
						</CardDescription>
					</CardHeader>
					<CardContent data-testid="content">Content</CardContent>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>,
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
				<Card variant="default" data-testid="card">
					Default
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("border-dotted");
			expect(card.className).toContain("bg-card");
			expect(card.className).toContain("shadow-sm");
		});

		it("applies elevated variant classes", () => {
			render(
				<Card variant="elevated" data-testid="card">
					Elevated
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("border-dotted");
			expect(card.className).toContain("bg-surface-elevated");
			expect(card.className).toContain("shadow-md");
		});

		it("applies outline variant classes", () => {
			render(
				<Card variant="outline" data-testid="card">
					Outline
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("border-dotted");
			expect(card.className).toContain("border-2");
			expect(card.className).toContain("bg-transparent");
		});

		it("applies ghost variant classes", () => {
			render(
				<Card variant="ghost" data-testid="card">
					Ghost
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("bg-transparent");
		});
	});

	describe("Card Padding", () => {
		it("applies no padding by default", () => {
			render(<Card data-testid="card">No padding</Card>);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-0");
		});

		it("applies small padding", () => {
			render(
				<Card padding="sm" data-testid="card">
					Small padding
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-4");
		});

		it("applies medium padding", () => {
			render(
				<Card padding="md" data-testid="card">
					Medium padding
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-6");
		});

		it("applies large padding", () => {
			render(
				<Card padding="lg" data-testid="card">
					Large padding
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("p-8");
		});
	});

	describe("CardHeader", () => {
		it("renders with default medium padding", () => {
			render(
				<Card>
					<CardHeader data-testid="header">Header</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-6");
		});

		it("applies small padding", () => {
			render(
				<Card>
					<CardHeader padding="sm" data-testid="header">
						Header
					</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-4");
		});

		it("applies large padding", () => {
			render(
				<Card>
					<CardHeader padding="lg" data-testid="header">
						Header
					</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-8");
		});

		it("applies no padding", () => {
			render(
				<Card>
					<CardHeader padding="none" data-testid="header">
						Header
					</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("p-0");
		});
	});

	describe("CardTitle", () => {
		it("renders as h3 by default", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle data-testid="title">Title</CardTitle>
					</CardHeader>
				</Card>,
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H3");
		});

		it("renders as h1 when specified", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle as="h1" data-testid="title">
							Title
						</CardTitle>
					</CardHeader>
				</Card>,
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H1");
		});

		it("renders as h2 when specified", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle as="h2" data-testid="title">
							Title
						</CardTitle>
					</CardHeader>
				</Card>,
			);
			const title = screen.getByTestId("title");
			expect(title.tagName).toBe("H2");
		});

		it("applies title classes", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle data-testid="title">Title</CardTitle>
					</CardHeader>
				</Card>,
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
				<Card>
					<CardHeader>
						<CardDescription data-testid="description">
							Description text
						</CardDescription>
					</CardHeader>
				</Card>,
			);
			const description = screen.getByTestId("description");
			expect(description.tagName).toBe("P");
		});

		it("applies description classes", () => {
			render(
				<Card>
					<CardHeader>
						<CardDescription data-testid="description">
							Description
						</CardDescription>
					</CardHeader>
				</Card>,
			);
			const description = screen.getByTestId("description");
			expect(description.className).toContain("text-sm");
			expect(description.className).toContain("text-foreground-secondary");
		});
	});

	describe("CardContent", () => {
		it("renders with default medium padding", () => {
			render(
				<Card>
					<CardContent data-testid="content">Content</CardContent>
				</Card>,
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-6");
			expect(content.className).toContain("pt-0");
		});

		it("applies small padding", () => {
			render(
				<Card>
					<CardContent padding="sm" data-testid="content">
						Content
					</CardContent>
				</Card>,
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-4");
			expect(content.className).toContain("pt-0");
		});

		it("applies large padding", () => {
			render(
				<Card>
					<CardContent padding="lg" data-testid="content">
						Content
					</CardContent>
				</Card>,
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-8");
			expect(content.className).toContain("pt-0");
		});

		it("applies no padding", () => {
			render(
				<Card>
					<CardContent padding="none" data-testid="content">
						Content
					</CardContent>
				</Card>,
			);
			const content = screen.getByTestId("content");
			expect(content.className).toContain("p-0");
		});
	});

	describe("CardFooter", () => {
		it("renders with default medium padding", () => {
			render(
				<Card>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>,
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-6");
			expect(footer.className).toContain("pt-0");
		});

		it("applies small padding", () => {
			render(
				<Card>
					<CardFooter padding="sm" data-testid="footer">
						Footer
					</CardFooter>
				</Card>,
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-4");
			expect(footer.className).toContain("pt-0");
		});

		it("applies large padding", () => {
			render(
				<Card>
					<CardFooter padding="lg" data-testid="footer">
						Footer
					</CardFooter>
				</Card>,
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("p-8");
			expect(footer.className).toContain("pt-0");
		});

		it("applies flex layout classes", () => {
			render(
				<Card>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>,
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("items-center");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with Card variant classes", () => {
			render(
				<Card className="custom-card" data-testid="card">
					Custom
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("custom-card");
			expect(card.className).toContain("rounded-lg");
		});

		it("merges custom className with CardHeader", () => {
			render(
				<Card>
					<CardHeader className="custom-header" data-testid="header">
						Header
					</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("custom-header");
			expect(header.className).toContain("flex");
		});

		it("merges custom className with CardTitle", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle className="custom-title" data-testid="title">
							Title
						</CardTitle>
					</CardHeader>
				</Card>,
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
				<Card
					ref={(el) => {
						ref = el;
					}}
				>
					Card
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref!.tagName).toBe("DIV");
		});

		it("forwards ref to CardHeader element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<Card>
					<CardHeader
						ref={(el) => {
							ref = el;
						}}
					>
						Header
					</CardHeader>
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});

		it("forwards ref to CardTitle element", () => {
			let ref: HTMLHeadingElement | null = null;
			render(
				<Card>
					<CardHeader>
						<CardTitle
							ref={(el) => {
								ref = el;
							}}
						>
							Title
						</CardTitle>
					</CardHeader>
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLHeadingElement);
			expect(ref!.tagName).toBe("H3");
		});

		it("forwards ref to CardDescription element", () => {
			let ref: HTMLParagraphElement | null = null;
			render(
				<Card>
					<CardHeader>
						<CardDescription
							ref={(el) => {
								ref = el;
							}}
						>
							Description
						</CardDescription>
					</CardHeader>
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLParagraphElement);
		});

		it("forwards ref to CardContent element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<Card>
					<CardContent
						ref={(el) => {
							ref = el;
						}}
					>
						Content
					</CardContent>
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});

		it("forwards ref to CardFooter element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<Card>
					<CardFooter
						ref={(el) => {
							ref = el;
						}}
					>
						Footer
					</CardFooter>
				</Card>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});
	});

	describe("HTML Attributes", () => {
		it("passes through HTML attributes to Card", () => {
			render(
				<Card id="test-card" data-testid="card">
					Card
				</Card>,
			);
			const card = screen.getByTestId("card");
			expect(card).toHaveAttribute("id", "test-card");
		});

		it("passes through onClick handler to Card", () => {
			let clicked = false;
			render(
				<Card
					onClick={() => {
						clicked = true;
					}}
					data-testid="card"
				>
					Clickable Card
				</Card>,
			);
			const card = screen.getByTestId("card");
			card.click();
			expect(clicked).toBe(true);
		});
	});

	describe("Base Classes", () => {
		it("Card always includes base classes", () => {
			render(<Card data-testid="card">Card</Card>);
			const card = screen.getByTestId("card");
			expect(card.className).toContain("relative");
			expect(card.className).toContain("rounded-lg");
			expect(card.className).toContain("transition-base");
		});

		it("CardHeader always includes base classes", () => {
			render(
				<Card>
					<CardHeader data-testid="header">Header</CardHeader>
				</Card>,
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("flex");
			expect(header.className).toContain("flex-col");
		});

		it("CardTitle always includes base classes", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle data-testid="title">Title</CardTitle>
					</CardHeader>
				</Card>,
			);
			const title = screen.getByTestId("title");
			expect(title.className).toContain("text-2xl");
			expect(title.className).toContain("font-semibold");
			expect(title.className).toContain("leading-none");
			expect(title.className).toContain("tracking-tight");
		});

		it("CardDescription always includes base classes", () => {
			render(
				<Card>
					<CardHeader>
						<CardDescription data-testid="description">
							Description
						</CardDescription>
					</CardHeader>
				</Card>,
			);
			const description = screen.getByTestId("description");
			expect(description.className).toContain("text-sm");
			expect(description.className).toContain("text-foreground-secondary");
			expect(description.className).toContain("mt-1.5");
		});

		it("CardFooter always includes base classes", () => {
			render(
				<Card>
					<CardFooter data-testid="footer">Footer</CardFooter>
				</Card>,
			);
			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("items-center");
		});
	});

	describe("Complex Composition", () => {
		it("renders a complete card with all sections", () => {
			render(
				<Card variant="elevated" data-testid="card">
					<CardHeader data-testid="header">
						<CardTitle>Card Title</CardTitle>
						<CardDescription>This is a card description</CardDescription>
					</CardHeader>
					<CardContent data-testid="content">
						Card content goes here
					</CardContent>
					<CardFooter data-testid="footer">Footer actions</CardFooter>
				</Card>,
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
				<Card data-testid="card">
					<CardHeader data-testid="header">
						<CardTitle>Title</CardTitle>
					</CardHeader>
					<CardContent data-testid="content">Content</CardContent>
				</Card>,
			);

			const card = screen.getByTestId("card");
			const header = screen.getByTestId("header");
			const content = screen.getByTestId("content");

			expect(card.contains(header)).toBe(true);
			expect(card.contains(content)).toBe(true);
		});
	});
});

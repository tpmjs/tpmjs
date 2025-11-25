import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { Container } from "./Container";

describe("Container", () => {
	describe("Rendering", () => {
		it("renders a container element", () => {
			render(
				createElement(Container, { "data-testid": "container" }, "Content"),
			);
			const container = screen.getByTestId("container");
			expect(container).toBeInTheDocument();
			expect(container.tagName).toBe("DIV");
		});

		it("renders children content", () => {
			render(createElement(Container, null, "Container content"));
			expect(screen.getByText("Container content")).toBeInTheDocument();
		});
	});

	describe("Size Variants", () => {
		it("applies small size max-width", () => {
			render(
				createElement(
					Container,
					{ size: "sm", "data-testid": "container" },
					"Small",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-sm");
		});

		it("applies medium size max-width", () => {
			render(
				createElement(
					Container,
					{ size: "md", "data-testid": "container" },
					"Medium",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-md");
		});

		it("applies large size max-width", () => {
			render(
				createElement(
					Container,
					{ size: "lg", "data-testid": "container" },
					"Large",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-lg");
		});

		it("applies extra-large size max-width (default)", () => {
			render(
				createElement(
					Container,
					{ size: "xl", "data-testid": "container" },
					"XLarge",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-xl");
		});

		it("applies 2xl size max-width", () => {
			render(
				createElement(
					Container,
					{ size: "2xl", "data-testid": "container" },
					"2XLarge",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-2xl");
		});

		it("applies full width", () => {
			render(
				createElement(
					Container,
					{ size: "full", "data-testid": "container" },
					"Full",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-full");
		});

		it("uses xl size by default", () => {
			render(
				createElement(Container, { "data-testid": "container" }, "Default"),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-xl");
		});
	});

	describe("Padding Variants", () => {
		it("applies no padding", () => {
			render(
				createElement(
					Container,
					{ padding: "none", "data-testid": "container" },
					"None",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("px-0");
		});

		it("applies small padding", () => {
			render(
				createElement(
					Container,
					{ padding: "sm", "data-testid": "container" },
					"Small",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("px-4");
		});

		it("applies medium padding (default)", () => {
			render(
				createElement(
					Container,
					{ padding: "md", "data-testid": "container" },
					"Medium",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("px-6");
		});

		it("applies large padding", () => {
			render(
				createElement(
					Container,
					{ padding: "lg", "data-testid": "container" },
					"Large",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("px-8");
		});

		it("uses md padding by default", () => {
			render(
				createElement(Container, { "data-testid": "container" }, "Default"),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("px-6");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with small size and no padding", () => {
			render(
				createElement(
					Container,
					{
						size: "sm",
						padding: "none",
						"data-testid": "container",
					},
					"Small no padding",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-screen-sm");
			expect(container.className).toContain("px-0");
		});

		it("works correctly with full width and large padding", () => {
			render(
				createElement(
					Container,
					{
						size: "full",
						padding: "lg",
						"data-testid": "container",
					},
					"Full large padding",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("max-w-full");
			expect(container.className).toContain("px-8");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				createElement(
					Container,
					{
						id: "container-id",
						"data-testid": "container",
					},
					"Container",
				),
			);
			const container = screen.getByTestId("container");
			expect(container).toHaveAttribute("id", "container-id");
		});

		it("passes through onClick handler", () => {
			let clicked = false;
			render(
				createElement(
					Container,
					{
						onClick: () => {
							clicked = true;
						},
						"data-testid": "container",
					},
					"Clickable",
				),
			);
			const container = screen.getByTestId("container");
			container.click();
			expect(clicked).toBe(true);
		});

		it("passes through aria attributes", () => {
			render(
				createElement(
					Container,
					{
						"aria-label": "Main container",
						"data-testid": "container",
					},
					"Container",
				),
			);
			const container = screen.getByTestId("container");
			expect(container).toHaveAttribute("aria-label", "Main container");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				createElement(
					Container,
					{
						className: "custom-class",
						"data-testid": "container",
					},
					"Custom",
				),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("custom-class");
			expect(container.className).toContain("mx-auto");
			expect(container.className).toContain("w-full");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to container element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Container,
					{
						ref: (el: HTMLDivElement | null) => {
							ref = el;
						},
					},
					"Container",
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref?.tagName).toBe("DIV");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(
				createElement(Container, { "data-testid": "container" }, "Container"),
			);
			const container = screen.getByTestId("container");
			expect(container.className).toContain("mx-auto");
			expect(container.className).toContain("w-full");
		});
	});
});

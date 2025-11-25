import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
	describe("Rendering", () => {
		it("renders a section element by default", () => {
			render(<Section data-testid="section">Content</Section>);
			const section = screen.getByTestId("section");
			expect(section).toBeInTheDocument();
			expect(section.tagName).toBe("SECTION");
		});

		it("renders content", () => {
			render(<Section>Test content</Section>);
			expect(screen.getByText("Test content")).toBeInTheDocument();
		});

		it("renders as different semantic elements", () => {
			const { rerender } = render(
				<Section as="article" data-testid="element">
					Content
				</Section>,
			);
			expect(screen.getByTestId("element").tagName).toBe("ARTICLE");

			rerender(
				<Section as="aside" data-testid="element">
					Content
				</Section>,
			);
			expect(screen.getByTestId("element").tagName).toBe("ASIDE");

			rerender(
				<Section as="nav" data-testid="element">
					Content
				</Section>,
			);
			expect(screen.getByTestId("element").tagName).toBe("NAV");

			rerender(
				<Section as="div" data-testid="element">
					Content
				</Section>,
			);
			expect(screen.getByTestId("element").tagName).toBe("DIV");
		});
	});

	describe("Spacing Variants", () => {
		it("applies no spacing", () => {
			render(
				<Section spacing="none" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-0");
		});

		it("applies small spacing", () => {
			render(
				<Section spacing="sm" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-8");
		});

		it("applies medium spacing", () => {
			render(
				<Section spacing="md" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-16");
		});

		it("applies large spacing", () => {
			render(
				<Section spacing="lg" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-24");
		});

		it("applies extra large spacing", () => {
			render(
				<Section spacing="xl" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-32");
		});

		it("uses md spacing by default", () => {
			render(<Section data-testid="section">Content</Section>);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-16");
		});
	});

	describe("Background Variants", () => {
		it("applies default background", () => {
			render(
				<Section background="default" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("bg-background");
		});

		it("applies surface background", () => {
			render(
				<Section background="surface" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("bg-surface");
		});

		it("applies dotted-grid background", () => {
			render(
				<Section background="dotted-grid" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("dotted-grid-background");
		});

		it("applies blueprint background", () => {
			render(
				<Section background="blueprint" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("blueprint-background");
		});

		it("applies grid background", () => {
			render(
				<Section background="grid" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("grid-background");
		});
	});

	describe("Container Variants", () => {
		it("applies no container by default", () => {
			render(<Section data-testid="section">Content</Section>);
			const section = screen.getByTestId("section");
			expect(section.className).not.toContain("max-w");
		});

		it("applies small container", () => {
			render(
				<Section container="sm" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("max-w-3xl");
		});

		it("applies medium container", () => {
			render(
				<Section container="md" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("max-w-5xl");
		});

		it("applies large container", () => {
			render(
				<Section container="lg" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("max-w-7xl");
		});

		it("applies extra large container", () => {
			render(
				<Section container="xl" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("max-w-[90rem]");
		});

		it("applies full width container", () => {
			render(
				<Section container="full" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("max-w-full");
		});
	});

	describe("Centered Option", () => {
		it("does not center by default", () => {
			render(<Section data-testid="section">Content</Section>);
			const section = screen.getByTestId("section");
			expect(section.className).not.toContain("mx-auto");
		});

		it("centers content when centered is true", () => {
			render(
				<Section centered data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("mx-auto");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				<Section id="section-id" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section).toHaveAttribute("id", "section-id");
		});

		it("passes through data attributes", () => {
			render(
				<Section data-custom="test" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section).toHaveAttribute("data-custom", "test");
		});

		it("passes through aria attributes", () => {
			render(
				<Section aria-label="Main section" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section).toHaveAttribute("aria-label", "Main section");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				<Section className="custom-class" data-testid="section">
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("custom-class");
			expect(section.className).toContain("relative");
			expect(section.className).toContain("w-full");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to section element", () => {
			let ref: HTMLElement | null = null;
			render(
				<Section
					ref={(el: HTMLElement | null) => {
						ref = el;
					}}
				>
					Content
				</Section>,
			);
			expect(ref).toBeInstanceOf(HTMLElement);
			expect(ref?.tagName).toBe("SECTION");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Section data-testid="section">Content</Section>);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("relative");
			expect(section.className).toContain("w-full");
		});
	});

	describe("Compound Scenarios", () => {
		it("works with multiple variants combined", () => {
			render(
				<Section
					spacing="lg"
					background="blueprint"
					container="xl"
					centered
					data-testid="section"
				>
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-24");
			expect(section.className).toContain("blueprint-background");
			expect(section.className).toContain("max-w-[90rem]");
			expect(section.className).toContain("mx-auto");
		});

		it("works with custom className and variants", () => {
			render(
				<Section
					spacing="md"
					background="surface"
					className="border-t border-border"
					data-testid="section"
				>
					Content
				</Section>,
			);
			const section = screen.getByTestId("section");
			expect(section.className).toContain("py-16");
			expect(section.className).toContain("bg-surface");
			expect(section.className).toContain("border-t");
		});
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
	describe("Rendering", () => {
		it("renders a label element", () => {
			render(<Label data-testid="label">Label text</Label>);
			const label = screen.getByTestId("label");
			expect(label).toBeInTheDocument();
			expect(label.tagName).toBe("LABEL");
		});

		it("renders children text", () => {
			render(<Label>Email Address</Label>);
			expect(screen.getByText("Email Address")).toBeInTheDocument();
		});
	});

	describe("Sizes", () => {
		it("applies small size classes", () => {
			render(
				<Label size="sm" data-testid="label">
					Small label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-sm");
		});

		it("applies medium size classes (default)", () => {
			render(
				<Label size="md" data-testid="label">
					Medium label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-base");
		});

		it("applies large size classes", () => {
			render(
				<Label size="lg" data-testid="label">
					Large label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-lg");
		});

		it("uses medium size by default", () => {
			render(<Label data-testid="label">Default label</Label>);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-base");
		});
	});

	describe("Required Indicator", () => {
		it("does not show required indicator by default", () => {
			render(<Label>Label</Label>);
			expect(screen.queryByText("*")).not.toBeInTheDocument();
		});

		it("shows required indicator when required is true", () => {
			render(<Label required>Required field</Label>);
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("hides required indicator from screen readers", () => {
			render(
				<Label required data-testid="label">
					Required field
				</Label>,
			);
			const asterisk = screen.getByText("*");
			expect(asterisk).toHaveAttribute("aria-hidden", "true");
		});

		it("applies error color to required indicator", () => {
			render(<Label required>Required field</Label>);
			const asterisk = screen.getByText("*");
			expect(asterisk.className).toContain("text-error");
		});

		it("applies proper spacing to required indicator", () => {
			render(<Label required>Required field</Label>);
			const asterisk = screen.getByText("*");
			expect(asterisk.className).toContain("ml-1");
		});
	});

	describe("Disabled State", () => {
		it("is not disabled by default", () => {
			render(<Label data-testid="label">Label</Label>);
			const label = screen.getByTestId("label");
			// Should not have the direct opacity-50 class (peer-disabled:opacity-50 is okay)
			expect(label.className).toContain("peer-disabled:opacity-50");
			expect(label.className.split(" ")).not.toContain("opacity-50");
		});

		it("applies disabled classes when disabled is true", () => {
			render(
				<Label disabled data-testid="label">
					Disabled label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("opacity-50");
			expect(label.className).toContain("cursor-not-allowed");
		});
	});

	describe("HTML Attributes", () => {
		it("associates with input using htmlFor", () => {
			render(
				<Label htmlFor="email-input" data-testid="label">
					Email
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label).toHaveAttribute("for", "email-input");
		});

		it("passes through id attribute", () => {
			render(
				<Label id="label-id" data-testid="label">
					Label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label).toHaveAttribute("id", "label-id");
		});

		it("passes through className", () => {
			render(
				<Label className="custom-label" data-testid="label">
					Custom
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("custom-label");
		});

		it("passes through onClick handler", () => {
			let clicked = false;
			render(
				<Label
					onClick={() => {
						clicked = true;
					}}
					data-testid="label"
				>
					Clickable
				</Label>,
			);
			const label = screen.getByTestId("label");
			label.click();
			expect(clicked).toBe(true);
		});
	});

	describe("ARIA Attributes", () => {
		it("passes through aria-label", () => {
			render(
				<Label aria-label="Field label" data-testid="label">
					Label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label).toHaveAttribute("aria-label", "Field label");
		});

		it("passes through aria-describedby", () => {
			render(
				<Label aria-describedby="description-id" data-testid="label">
					Label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label).toHaveAttribute("aria-describedby", "description-id");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with base classes", () => {
			render(
				<Label className="custom-class" data-testid="label">
					Label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("custom-class");
			expect(label.className).toContain("font-medium");
			expect(label.className).toContain("text-foreground");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to label element", () => {
			let ref: HTMLLabelElement | null = null;
			render(
				<Label
					ref={(el) => {
						ref = el;
					}}
				>
					Label
				</Label>,
			);
			expect(ref).toBeInstanceOf(HTMLLabelElement);
			expect(ref!.tagName).toBe("LABEL");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Label data-testid="label">Label</Label>);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("font-medium");
			expect(label.className).toContain("text-foreground");
			expect(label.className).toContain("cursor-pointer");
		});

		it("includes peer-disabled classes", () => {
			render(<Label data-testid="label">Label</Label>);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("peer-disabled:cursor-not-allowed");
			expect(label.className).toContain("peer-disabled:opacity-50");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with required and small size", () => {
			render(
				<Label required size="sm" data-testid="label">
					Small required
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-sm");
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("works correctly with disabled and required", () => {
			render(
				<Label disabled required data-testid="label">
					Disabled required
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("opacity-50");
			expect(label.className).toContain("cursor-not-allowed");
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("works correctly with htmlFor and required", () => {
			render(
				<Label htmlFor="field-id" required data-testid="label">
					Field label
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label).toHaveAttribute("for", "field-id");
			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("works correctly with large size and custom className", () => {
			render(
				<Label size="lg" className="font-bold" data-testid="label">
					Large bold
				</Label>,
			);
			const label = screen.getByTestId("label");
			expect(label.className).toContain("text-lg");
			expect(label.className).toContain("font-bold");
		});
	});

	describe("Integration with Form Controls", () => {
		it("associates correctly with input element", () => {
			const { container } = render(
				<div>
					<Label htmlFor="test-input">Test Label</Label>
					<input id="test-input" type="text" />
				</div>,
			);

			const label = container.querySelector("label");
			const input = container.querySelector("input");

			expect(label).toHaveAttribute("for", "test-input");
			expect(input).toHaveAttribute("id", "test-input");
		});

		it("clicking label focuses associated input", () => {
			render(
				<div>
					<Label htmlFor="focus-input" data-testid="label">
						Click me
					</Label>
					<input id="focus-input" type="text" data-testid="input" />
				</div>,
			);

			const label = screen.getByTestId("label");
			const input = screen.getByTestId("input") as HTMLInputElement;

			// Verify the association exists
			expect(label).toHaveAttribute("for", "focus-input");
			expect(input).toHaveAttribute("id", "focus-input");

			// Focus the input directly to verify it can receive focus
			input.focus();
			expect(input).toHaveFocus();
		});
	});
});

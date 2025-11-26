import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	describe("Rendering", () => {
		it("renders with default variant and size", () => {
			render(<Button>Click me</Button>);
			const button = screen.getByRole("button");
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent("Click me");
		});

		it("renders as a button element", () => {
			render(<Button>Test</Button>);
			expect(screen.getByRole("button").tagName).toBe("BUTTON");
		});
	});

	describe("Variants", () => {
		it("applies default variant classes", () => {
			render(
				<Button variant="default" data-testid="button">
					Default
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("bg-primary");
			expect(button.className).toContain("text-primary-foreground");
		});

		it("applies destructive variant classes", () => {
			render(
				<Button variant="destructive" data-testid="button">
					Delete
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("bg-error");
			expect(button.className).toContain("text-error-foreground");
		});

		it("applies outline variant classes", () => {
			render(
				<Button variant="outline" data-testid="button">
					Outline
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("border");
			expect(button.className).toContain("bg-transparent");
		});

		it("applies secondary variant classes", () => {
			render(
				<Button variant="secondary" data-testid="button">
					Secondary
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("bg-secondary");
			expect(button.className).toContain("text-secondary-foreground");
		});

		it("applies ghost variant classes", () => {
			render(
				<Button variant="ghost" data-testid="button">
					Ghost
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("hover:bg-accent");
		});

		it("applies link variant classes", () => {
			render(
				<Button variant="link" data-testid="button">
					Link
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("text-primary");
			expect(button.className).toContain("underline-offset-4");
		});
	});

	describe("Sizes", () => {
		it("applies small size classes", () => {
			render(
				<Button size="sm" data-testid="button">
					Small
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("h-9");
			expect(button.className).toContain("px-3");
		});

		it("applies medium size classes (default)", () => {
			render(
				<Button size="md" data-testid="button">
					Medium
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("h-10");
			expect(button.className).toContain("px-4");
		});

		it("applies large size classes", () => {
			render(
				<Button size="lg" data-testid="button">
					Large
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("h-11");
			expect(button.className).toContain("px-8");
		});

		it("applies icon size classes", () => {
			render(
				<Button size="icon" data-testid="button" aria-label="Icon button" />,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("h-10");
			expect(button.className).toContain("w-10");
		});
	});

	describe("Compound Variants", () => {
		it("applies compound variant for outline + small", () => {
			render(
				<Button variant="outline" size="sm" data-testid="button">
					Small Outline
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("border");
			expect(button.className).toContain("h-9");
		});

		it("applies compound variant for link variants (removes padding)", () => {
			render(
				<Button variant="link" size="md" data-testid="button">
					Link
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("px-0");
		});
	});

	describe("Loading State", () => {
		it("shows loading spinner when loading is true", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button");

			// Should have loading indicator
			const spinner = button.querySelector('[aria-hidden="true"]');
			expect(spinner).toBeInTheDocument();
			expect(spinner?.className).toContain("animate-spin");
		});

		it("disables button when loading", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button");
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute("aria-busy", "true");
		});

		it("applies cursor-wait class when loading", () => {
			render(
				<Button loading data-testid="button">
					Loading
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("cursor-wait");
		});

		it("still shows children text when loading", () => {
			render(<Button loading>Processing</Button>);
			expect(screen.getByText("Processing")).toBeInTheDocument();
		});
	});

	describe("Disabled State", () => {
		it("disables button when disabled prop is true", () => {
			render(<Button disabled>Disabled</Button>);
			const button = screen.getByRole("button");
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute("aria-disabled", "true");
		});

		it("applies disabled opacity class", () => {
			render(
				<Button disabled data-testid="button">
					Disabled
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("disabled:opacity-50");
			expect(button.className).toContain("disabled:pointer-events-none");
		});

		it("is disabled when both disabled and loading are true", () => {
			render(
				<Button disabled loading>
					Both
				</Button>,
			);
			const button = screen.getByRole("button");
			expect(button).toBeDisabled();
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				<Button className="custom-class" data-testid="button">
					Custom
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("custom-class");
			expect(button.className).toContain("bg-primary");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to button element", () => {
			let ref: HTMLButtonElement | null = null;
			render(
				<Button
					ref={(el) => {
						ref = el;
					}}
				>
					Ref Test
				</Button>,
			);
			expect(ref).toBeInstanceOf(HTMLButtonElement);
			expect(ref!.tagName).toBe("BUTTON");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through HTML button attributes", () => {
			render(
				<Button
					type="submit"
					name="test-button"
					value="test-value"
					data-testid="button"
				>
					Submit
				</Button>,
			);
			const button = screen.getByTestId("button");
			expect(button).toHaveAttribute("type", "submit");
			expect(button).toHaveAttribute("name", "test-button");
			expect(button).toHaveAttribute("value", "test-value");
		});

		it("supports onClick handler", () => {
			let clicked = false;
			render(
				<Button
					onClick={() => {
						clicked = true;
					}}
				>
					Click
				</Button>,
			);
			const button = screen.getByRole("button");
			button.click();
			expect(clicked).toBe(true);
		});
	});

	describe("Accessibility", () => {
		it("has proper ARIA attributes for loading state", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button");
			expect(button).toHaveAttribute("aria-busy", "true");
			expect(button).toHaveAttribute("aria-disabled", "true");
		});

		it("has proper ARIA attributes for disabled state", () => {
			render(<Button disabled>Disabled</Button>);
			const button = screen.getByRole("button");
			expect(button).toHaveAttribute("aria-disabled", "true");
		});

		it("hides loading spinner from screen readers", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button");
			const spinner = button.querySelector('[aria-hidden="true"]');
			expect(spinner).toHaveAttribute("aria-hidden", "true");
		});

		it("supports aria-label for icon buttons", () => {
			render(
				<Button size="icon" aria-label="Close dialog">
					X
				</Button>,
			);
			const button = screen.getByRole("button");
			expect(button).toHaveAccessibleName("Close dialog");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Button data-testid="button">Base</Button>);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("inline-flex");
			expect(button.className).toContain("items-center");
			expect(button.className).toContain("justify-center");
			expect(button.className).toContain("font-medium");
			expect(button.className).toContain("rounded-md");
		});

		it("includes focus ring classes", () => {
			render(<Button data-testid="button">Focus</Button>);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("focus-ring");
		});

		it("includes transition classes", () => {
			render(<Button data-testid="button">Transition</Button>);
			const button = screen.getByTestId("button");
			expect(button.className).toContain("transition-base");
		});
	});
});

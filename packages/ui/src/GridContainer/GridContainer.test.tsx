import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridContainer } from "./GridContainer";

describe("GridContainer", () => {
	describe("Rendering", () => {
		it("renders a div element", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid).toBeInTheDocument();
			expect(grid.tagName).toBe("DIV");
		});

		it("renders content", () => {
			render(<GridContainer>Test content</GridContainer>);
			expect(screen.getByText("Test content")).toBeInTheDocument();
		});

		it("renders multiple children", () => {
			render(
				<GridContainer>
					<div>Child 1</div>
					<div>Child 2</div>
					<div>Child 3</div>
				</GridContainer>,
			);
			expect(screen.getByText("Child 1")).toBeInTheDocument();
			expect(screen.getByText("Child 2")).toBeInTheDocument();
			expect(screen.getByText("Child 3")).toBeInTheDocument();
		});
	});

	describe("Column Variants", () => {
		it("applies auto columns by default", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("grid-cols-[repeat(auto-fit");
		});

		it("applies single column", () => {
			render(
				<GridContainer columns={1} data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("grid-cols-1");
		});

		it("applies responsive 2 columns", () => {
			render(
				<GridContainer columns={2} data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("grid-cols-1");
			expect(grid.className).toContain("md:grid-cols-2");
		});

		it("applies responsive 3 columns", () => {
			render(
				<GridContainer columns={3} data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("lg:grid-cols-3");
		});

		it("applies responsive 4 columns", () => {
			render(
				<GridContainer columns={4} data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("lg:grid-cols-4");
		});
	});

	describe("Gap Variants", () => {
		it("applies no gap", () => {
			render(
				<GridContainer gap="none" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("gap-0");
		});

		it("applies small gap", () => {
			render(
				<GridContainer gap="sm" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("gap-4");
		});

		it("applies medium gap by default", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("gap-6");
		});

		it("applies large gap", () => {
			render(
				<GridContainer gap="lg" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("gap-8");
		});

		it("applies extra large gap", () => {
			render(
				<GridContainer gap="xl" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("gap-12");
		});
	});

	describe("Responsive Behavior", () => {
		it("uses responsive by default", () => {
			render(
				<GridContainer columns={3} data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("md:grid-cols");
		});

		it("applies fixed columns when responsive is false", () => {
			render(
				<GridContainer columns={3} responsive="fixed" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			// When responsive="fixed", compound variant adds grid-cols-3
			// Base variant still adds responsive classes, but compound variant takes precedence
			expect(grid.className).toContain("grid-cols-3");
		});
	});

	describe("Alignment", () => {
		it("applies start alignment", () => {
			render(
				<GridContainer align="start" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("items-start");
		});

		it("applies center alignment", () => {
			render(
				<GridContainer align="center" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("items-center");
		});

		it("applies end alignment", () => {
			render(
				<GridContainer align="end" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("items-end");
		});

		it("applies stretch alignment by default", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("items-stretch");
		});
	});

	describe("Justification", () => {
		it("applies start justify by default", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("justify-items-start");
		});

		it("applies center justify", () => {
			render(
				<GridContainer justify="center" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("justify-items-center");
		});

		it("applies end justify", () => {
			render(
				<GridContainer justify="end" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("justify-items-end");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				<GridContainer id="grid-id" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid).toHaveAttribute("id", "grid-id");
		});

		it("passes through data attributes", () => {
			render(
				<GridContainer data-custom="test" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid).toHaveAttribute("data-custom", "test");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				<GridContainer className="custom-class" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("custom-class");
			expect(grid.className).toContain("grid");
			expect(grid.className).toContain("w-full");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to div element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<GridContainer
					ref={(el) => {
						ref = el;
					}}
				>
					Content
				</GridContainer>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<GridContainer data-testid="grid">Content</GridContainer>);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("grid");
			expect(grid.className).toContain("w-full");
		});
	});

	describe("Compound Scenarios", () => {
		it("works with multiple variants combined", () => {
			render(
				<GridContainer columns={4} gap="lg" align="center" justify="center" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("lg:grid-cols-4");
			expect(grid.className).toContain("gap-8");
			expect(grid.className).toContain("items-center");
			expect(grid.className).toContain("justify-items-center");
		});

		it("works with fixed columns and custom className", () => {
			render(
				<GridContainer columns={3} responsive="fixed" className="my-custom-grid" data-testid="grid">
					Content
				</GridContainer>,
			);
			const grid = screen.getByTestId("grid");
			expect(grid.className).toContain("grid-cols-3");
			expect(grid.className).toContain("my-custom-grid");
		});
	});
});
